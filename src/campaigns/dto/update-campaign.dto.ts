import { PartialType } from '@nestjs/mapped-types';
import { CreateCampaignDto } from './create-campaign.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @IsOptional()
  @IsString()
  @IsIn(['Draft', 'Pending Approval', 'Active', 'Paused', 'Completed', 'Cancelled', 'Rejected'])
  status?: string;
}



