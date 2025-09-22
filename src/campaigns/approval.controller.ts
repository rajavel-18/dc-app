import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body, 
  Query, 
  ParseIntPipe, 
  UseGuards, 
  Req,
  Res,
  HttpStatus
} from '@nestjs/common';
import type { Response } from 'express';
import { ApprovalService } from './approval.service';
import { SubmitForApprovalDto, ApproveCampaignDto, RejectCampaignDto } from './dto/approval.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';

@Controller('campaigns/approval')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  // Admin can submit campaigns for approval
  @Roles('Admin')
  @Post(':id/submit')
  async submitForApproval(
    @Param('id', ParseIntPipe) campaignId: number,
    @Body() dto: SubmitForApprovalDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.approvalService.submitForApproval(campaignId, userId, dto);
  }

  // Checker can approve campaigns
  @Roles('Checker')
  @Post(':id/approve')
  async approveCampaign(
    @Param('id', ParseIntPipe) campaignId: number,
    @Body() dto: ApproveCampaignDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.approvalService.approveCampaign(campaignId, userId, dto);
  }

  // Checker can reject campaigns
  @Roles('Checker')
  @Post(':id/reject')
  async rejectCampaign(
    @Param('id', ParseIntPipe) campaignId: number,
    @Body() dto: RejectCampaignDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.approvalService.rejectCampaign(campaignId, userId, dto);
  }

  // Get campaigns pending approval (for Checker dashboard)
  @Roles('Checker', 'Admin')
  @Get('pending')
  async getPendingApprovals(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'submittedForApprovalAt' | 'name',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.approvalService.getCampaignsPendingApproval(page, limit, search, sortBy, sortOrder);
  }

  // Get detailed campaign for review
  @Roles('Checker', 'Admin')
  @Get(':id/review')
  async getCampaignForReview(@Param('id', ParseIntPipe) campaignId: number) {
    return this.approvalService.getCampaignForReview(campaignId);
  }

  // Get approval history for a campaign
  @Roles('Checker', 'Admin')
  @Get(':id/history')
  async getApprovalHistory(@Param('id', ParseIntPipe) campaignId: number) {
    return this.approvalService.getApprovalHistory(campaignId);
  }

  // Export campaigns for approval (Excel format)
  @Roles('Checker', 'Admin')
  @Get('export')
  async exportCampaignsForApproval(@Res() res: Response) {
    const campaigns = await this.approvalService.exportCampaignsForApproval();
    
    // Convert to CSV format (simplified - in production, use a proper Excel library)
    const csvHeaders = [
      'ID', 'Name', 'Status', 'State', 'DPD', 'Channel', 'Template', 'Language',
      'Condition Count', 'Assigned Count', 'Start Date', 'End Date', 
      'Submitted At', 'Created By'
    ].join(',');
    
    const csvRows = campaigns.map(campaign => [
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.stateName,
      campaign.dpdName,
      campaign.channelName,
      campaign.templateName,
      campaign.languageName,
      campaign.conditionCount,
      campaign.assignedCount,
      campaign.startDate,
      campaign.endDate,
      campaign.submittedForApprovalAt,
      campaign.createdByName
    ].join(','));
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="campaigns-pending-approval.csv"');
    res.status(HttpStatus.OK).send(csvContent);
  }
}
