import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional, IsObject, Min, Max, IsIn } from 'class-validator';

export class CreateCampaignDto {
  @IsNotEmpty()
  @IsNumber()
  stateId: number;

  @IsNotEmpty()
  @IsNumber()
  dpdId: number;

  @IsNotEmpty()
  @IsNumber()
  channelId: number;

  @IsNotEmpty()
  @IsNumber()
  templateId: number;

  @IsNotEmpty()
  @IsNumber()
  languageId: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  retries?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1439) // < 24 hours in minutes
  retryIntervalMinutes?: number = 0;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, string>;

  // Optional filter columns for UC-001
  @IsOptional()
  @IsIn(['New','Old'])
  borrowerType?: string;

  @IsOptional()
  @IsString()
  segment?: string;

  @IsOptional()
  @IsString()
  productGroup?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  subProductType?: string;

  @IsOptional()
  @IsString()
  productVariant?: string;

  @IsOptional()
  @IsString()
  schemeName?: string;

  @IsOptional()
  @IsString()
  schemeCode?: string;

  // These will be set by the controller
  createdBy?: number;
  updatedBy?: number;
}

