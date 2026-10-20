import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { CasesModule } from './cases/cases.module';
import { HearingsModule } from './hearings/hearings.module';
import { RecordingsModule } from './recordings/recordings.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { ProtocolsModule } from './protocols/protocols.module';
import { AuditModule } from './audit/audit.module';
import { WorkflowModule } from './workflows/workflow.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '../../../.env'),
        resolve(__dirname, '../../../.env.local'),
        '.env',
        '.env.local',
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 60,
      },
    ]),
    PrismaModule,
    CasesModule,
    HearingsModule,
    RecordingsModule,
    TranscriptionModule,
    ProtocolsModule,
    AuditModule,
    WorkflowModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
