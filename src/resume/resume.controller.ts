
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express } from 'express';
import { ResumeService } from './resume.service';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('analyze')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const isPdf =
          file.mimetype === 'application/pdf' &&
          file.originalname.toLowerCase().endsWith('.pdf');

        if (!isPdf) {
          return callback(
            new BadRequestException('Please upload a PDF file.'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  
  async analyzeResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobDescription') jobDescription: string,
  ) {
    if (!file) {
      throw new BadRequestException('Resume PDF is required.');
    }

    if (
      typeof jobDescription !== 'string' ||
      jobDescription.trim().length < 30
    ) {
      throw new BadRequestException(
        'Job description must contain at least 30 characters.',
      );
    }

    return this.resumeService.analyzeResume(
      file.buffer,
      jobDescription.trim(),
    );
  }
}
