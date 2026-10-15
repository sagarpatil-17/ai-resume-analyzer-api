import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [ResumeService, PrismaService],
  controllers: [ResumeController]
})
export class ResumeModule { }
