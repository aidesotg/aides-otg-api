import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';

@Module({
  providers: [ActivityLogsService],
  controllers: [ActivityLogsController]
})
export class ActivityLogsModule {}
