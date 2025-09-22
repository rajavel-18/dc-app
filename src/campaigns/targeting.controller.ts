import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  ParseIntPipe,
  ValidationPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { TargetingService, TargetingCriteria } from './targeting.service';
import { IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';

export class TargetingRequestDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  stateIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  dpdIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  channelIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  templateIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  languageIds?: number[];

  @IsOptional()
  @IsObject()
  customFilters?: Record<string, string>;
}

@Controller('targeting')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TargetingController {
  constructor(private readonly targetingService: TargetingService) {}

  @Roles('Admin', 'User')
  @Post('find-campaigns')
  async findMatchingCampaigns(@Body(ValidationPipe) criteria: TargetingRequestDto) {
    return this.targetingService.findMatchingCampaigns(criteria);
  }

  @Roles('Admin', 'User')
  @Post('suggestions')
  async getTargetingSuggestions(@Body(ValidationPipe) partialCriteria: Partial<TargetingRequestDto>) {
    return this.targetingService.getTargetingSuggestions(partialCriteria);
  }

  @Roles('Admin', 'User')
  @Get('campaign/:id/performance')
  async analyzeCampaignPerformance(@Param('id', ParseIntPipe) campaignId: number) {
    return this.targetingService.analyzeCampaignPerformance(campaignId);
  }
}



