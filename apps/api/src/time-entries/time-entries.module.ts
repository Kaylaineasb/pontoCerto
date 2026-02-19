import { Module } from '@nestjs/common';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService } from './time-entries.service';
import { AuditLogsModule } from 'src/audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService]
})
export class TimeEntriesModule {}
