
import { Module } from '@nestjs/common';
import { NvidiaAiService } from './nvidia-ai.service';

@Module({
  providers: [NvidiaAiService],
  exports: [NvidiaAiService],
})
export class AiModule {}
