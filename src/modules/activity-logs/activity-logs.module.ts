import { Module } from '@nestjs/common';
import { ActivityLogsService } from './services/activity-logs.service';
import { ActivityLogsController } from './controllers/activity-logs.controller';

@Module({
  providers: [ActivityLogsService],
  controllers: [ActivityLogsController],
})
export class ActivityLogsModule {}
