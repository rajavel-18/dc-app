import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { TargetingController } from './targeting.controller';
import { TargetingService } from './targeting.service';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';

@Module({
  controllers: [CampaignsController, TargetingController, ReferenceController, AssignmentController, ApprovalController],
  providers: [CampaignsService, TargetingService, ReferenceService, AssignmentService, ApprovalService],
  exports: [CampaignsService, TargetingService, ReferenceService, AssignmentService, ApprovalService],
})
export class CampaignsModule {}



