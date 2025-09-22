import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class SubmitForApprovalDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ApproveCampaignDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RejectCampaignDto {
  @IsNotEmpty()
  @IsString()
  rejectionRemarks: string;
}

export class CampaignReviewResponseDto {
  id: number;
  name: string;
  status: string;
  stateName: string;
  dpdName: string;
  channelName: string;
  templateName: string;
  languageName: string;
  conditionCount: number;
  assignedCount: number;
  startDate: string;
  endDate: string;
  retries: number;
  retryIntervalMinutes: number;
  // UC-001 optional filters
  borrowerType?: string;
  segment?: string;
  productGroup?: string;
  productType?: string;
  subProductType?: string;
  productVariant?: string;
  schemeName?: string;
  schemeCode?: string;
  // Approval fields
  submittedForApprovalAt?: string;
  approvedAt?: string;
  approvedBy?: number;
  rejectedAt?: string;
  rejectedBy?: number;
  rejectionRemarks?: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  // Additional fields for review
  createdByName?: string;
  updatedByName?: string;
  approvedByName?: string;
  rejectedByName?: string;
}
