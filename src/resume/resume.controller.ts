
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express } from 'express';
import { ResumeService } from './resume.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GuestChatDto } from './dto/guest-chat.dto';
import { ResumeJobDto } from './dto/resume-job.dto';
import { RegisteredChatDto } from './dto/registered-chat.dto';

// ---------- Upload configuration ----------

const resumeUpload = FileInterceptor('resume', {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    const filename = file.originalname.toLowerCase();

    if (
      file.mimetype !== 'application/pdf' &&
      !filename.endsWith('.pdf')
    ) {
      return callback(
        new BadRequestException('Only PDF files are allowed'),
        false,
      );
    }

    if (!filename.endsWith('.pdf')) {
      return callback(
        new BadRequestException('Resume filename must end in .pdf'),
        false,
      );
    }

    callback(null, true);
  },
});

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) { }

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(resumeUpload)
  async analyzeForUser(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ResumeJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload a resume PDF');
    }

    return this.resumeService.analyzeForUser(
      user.userId,
      file.buffer,
      file.originalname,
      body.jobDescription,
    );
  }

  // ==========================================
  // GUEST: ANALYZE WITHOUT DATABASE SAVING
  // POST /api/resume/guest/analyze
  // ==========================================

  @Post('guest/analyze')
  @UseInterceptors(resumeUpload)
  async analyzeForGuest(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ResumeJobDto,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload a resume PDF');
    }

    return this.resumeService.analyzeForGuest(
      file.buffer,
      file.originalname,
      body.jobDescription,
    );
  }

  // ==========================================
  // REGISTERED USER: CHAT WITH SAVED ANALYSIS
  // POST /api/resume/chat
  // ==========================================

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async chatForUser(
    @Body() dto: RegisteredChatDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resumeService.chatForUser(
      user.userId,
      dto.analysisId,
      dto.message,
    );
  }

  // ==========================================
  // GUEST: TEMPORARY CHAT
  // POST /api/resume/guest/chat
  // ==========================================

  @Post('guest/chat')
  @HttpCode(HttpStatus.OK)
  async chatForGuest(@Body() dto: GuestChatDto) {
    return this.resumeService.chatForGuest(
      dto.analysisId,
      dto.message,
    );
  }

  // ==========================================
  // REGISTERED USER: LIST SAVED ANALYSES
  // GET /api/resume/history
  // ==========================================

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.resumeService.getHistory(user.userId);
  }

  // ==========================================
  // REGISTERED USER: GET ONE SAVED ANALYSIS
  // GET /api/resume/history/:id
  // ==========================================

  @Get('history/:id')
  @UseGuards(JwtAuthGuard)
  async getHistoryItem(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      throw new BadRequestException('Invalid analysis ID');
    }

    return this.resumeService.getHistoryItem(user.userId, id);
  }
}
