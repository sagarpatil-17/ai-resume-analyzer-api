
import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@Injectable()
export class NvidiaAiService {
  private readonly logger = new Logger(NvidiaAiService.name);

  private readonly apiKey = process.env.NVIDIA_API_KEY;
  private readonly baseUrl = (
    process.env.NVIDIA_BASE_URL ??
    'https://integrate.api.nvidia.com/v1'
  ).replace(/\/+$/, '');

  private readonly model =
    process.env.NVIDIA_MODEL ??
    'nvidia/nemotron-3.5-lightning-30b-a3b';

  async generateText(messages: ChatMessage[]): Promise<string> {
    const result = await this.request(messages, false);

    if (!result.trim()) {
      throw new BadGatewayException(
        'The AI provider returned an empty response.',
      );
    }

    return result.trim();
  }

  async generateJson<T>(
    messages: ChatMessage[],
  ): Promise<T> {
    const result = await this.request(messages, true);

    try {
      const parsed = JSON.parse(this.extractJson(result)) as T;

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Expected a JSON object.');
      }

      return parsed;
    } catch {
      this.logger.warn(
        'Nemotron returned invalid JSON after generation.',
      );

      throw new BadGatewayException(
        'The AI returned an invalid analysis response. Please try again.',
      );
    }
  }

  private async request(
    messages: ChatMessage[],
    jsonMode: boolean,
  ): Promise<string> {
    if (!this.apiKey) {
      this.logger.error('NVIDIA_API_KEY is not configured.');

      throw new BadGatewayException(
        'The AI provider is not configured.',
      );
    }

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(
          `${this.baseUrl}/chat/completions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(90_000),
            body: JSON.stringify({
              model: this.model,
              messages,
              temperature: 0.2,
              top_p: 0.95,
              max_tokens: jsonMode ? 4096 : 2048,
              stream: false,
              ...(jsonMode
                ? { response_format: { type: 'json_object' } }
                : {}),
              chat_template_kwargs: {
                enable_thinking: false,
              },
            }),
          },
        );

        if (!response.ok) {
          const details = await response.text();

          this.logger.warn(
            `NVIDIA API returned HTTP ${response.status}.`,
          );

          const retryable = [
            429, 500, 502, 503, 504,
          ].includes(response.status);

          if (retryable && attempt < maxAttempts - 1) {
            await this.wait(attempt);
            continue;
          }

          // Do not log or return the full provider response;
          // it may contain internal request details.
          if (retryable) {
            throw new ServiceUnavailableException(
              'The AI service is temporarily busy. Please try again shortly.',
            );
          }

          this.logger.error(
            `NVIDIA request failed. HTTP ${response.status}; ` +
              `response length: ${details.length}.`,
          );

          throw new BadGatewayException(
            response.status === 401 || response.status === 403
              ? 'The AI provider rejected the API credentials. Check your server configuration.'
              : 'The AI provider could not process the request.',
          );
        }

        const data = (await response.json()) as {
          choices?: Array<{
            message?: { content?: string | null };
            finish_reason?: string | null;
          }>;
        };

        const choice = data.choices?.[0];
        const content = choice?.message?.content;

        if (typeof content !== 'string' || !content.trim()) {
          this.logger.warn(
            `NVIDIA returned no text. finish_reason=${choice?.finish_reason ?? 'unknown'}`,
          );

          throw new BadGatewayException(
            'The AI provider returned no usable content.',
          );
        }

        return content;
      } catch (error: unknown) {
        if (
          error instanceof BadGatewayException ||
          error instanceof ServiceUnavailableException
        ) {
          throw error;
        }

        const isLastAttempt = attempt === maxAttempts - 1;

        this.logger.warn(
          `NVIDIA request attempt ${attempt + 1} failed.`,
        );

        if (isLastAttempt) {
          throw new ServiceUnavailableException(
            'The AI service is temporarily unavailable. Please try again shortly.',
          );
        }

        await this.wait(attempt);
      }
    }

    throw new ServiceUnavailableException(
      'The AI service is temporarily unavailable.',
    );
  }

  private async wait(attempt: number): Promise<void> {
    const delayMs = 1000 * 2 ** attempt;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  private extractJson(text: string): string {
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace < firstBrace) {
      throw new Error('No JSON object found.');
    }

    return cleaned.slice(firstBrace, lastBrace + 1);
  }
}
