import { Module } from '@nestjs/common';
import { ResumeModule } from './resume/resume.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ServerModule } from './server/server.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    AuthModule,
    ResumeModule,
    ServerModule
  ],
})
export class AppModule { }
