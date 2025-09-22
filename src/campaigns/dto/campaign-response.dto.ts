export class CampaignResponseDto {
  id: number;
  name: string;
  stateId: number;
  dpdId: number;
  channelId: number;
  templateId: number;
  languageId: number;
  retries: number;
  retryIntervalMinutes: number;
  startDate: string;
  endDate: string;
  status: string;
  conditionCount: number;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  filters?: Array<{
    id: number;
    key: string;
    value: string;
  }>;
}



