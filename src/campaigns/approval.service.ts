import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { eq, and, desc, like } from 'drizzle-orm';
import { campaigns, approvalAudit, states, dpdBuckets, channels, templates, languages, users } from '../../database/schema';
import { SubmitForApprovalDto, ApproveCampaignDto, RejectCampaignDto, CampaignReviewResponseDto } from './dto/approval.dto';

@Injectable()
export class ApprovalService {
  constructor(@Inject('DRIZZLE') private db: any) {}

  async submitForApproval(campaignId: number, userId: number, dto: SubmitForApprovalDto): Promise<{ message: string }> {
    // Check if campaign exists and is in Draft status
    const [campaign] = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== 'Draft') {
      throw new BadRequestException('Only Draft campaigns can be submitted for approval');
    }

    // Update campaign status and submission timestamp
    await this.db
      .update(campaigns)
      .set({
        status: 'Pending Approval',
        submittedForApprovalAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    // Log approval action
    await this.db.insert(approvalAudit).values({
      campaignId,
      action: 'SUBMIT',
      performedBy: userId,
      remarks: dto.remarks || 'Campaign submitted for approval',
    });

    return { message: 'Campaign submitted for approval successfully' };
  }

  async approveCampaign(campaignId: number, userId: number, dto: ApproveCampaignDto): Promise<{ message: string }> {
    // Check if campaign exists and is in Pending Approval status
    const [campaign] = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== 'Pending Approval') {
      throw new BadRequestException('Only campaigns pending approval can be approved');
    }

    // Update campaign status and approval timestamp
    await this.db
      .update(campaigns)
      .set({
        status: 'Active',
        approvedAt: new Date(),
        approvedBy: userId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    // Log approval action
    await this.db.insert(approvalAudit).values({
      campaignId,
      action: 'APPROVE',
      performedBy: userId,
      remarks: dto.remarks || 'Campaign approved',
    });

    return { message: 'Campaign approved successfully' };
  }

  async rejectCampaign(campaignId: number, userId: number, dto: RejectCampaignDto): Promise<{ message: string }> {
    // Check if campaign exists and is in Pending Approval status
    const [campaign] = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== 'Pending Approval') {
      throw new BadRequestException('Only campaigns pending approval can be rejected');
    }

    // Update campaign status and rejection details
    await this.db
      .update(campaigns)
      .set({
        status: 'Rejected',
        rejectedAt: new Date(),
        rejectedBy: userId,
        rejectionRemarks: dto.rejectionRemarks,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    // Log rejection action
    await this.db.insert(approvalAudit).values({
      campaignId,
      action: 'REJECT',
      performedBy: userId,
      remarks: dto.rejectionRemarks,
    });

    return { message: 'Campaign rejected successfully' };
  }

  async getCampaignsPendingApproval(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: 'createdAt' | 'submittedForApprovalAt' | 'name' = 'submittedForApprovalAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ campaigns: CampaignReviewResponseDto[], total: number }> {
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(campaigns.status, 'Pending Approval')];
    
    if (search) {
      conditions.push(like(campaigns.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    // Build order by
    const orderBy = sortOrder === 'asc' ? campaigns[sortBy] : desc(campaigns[sortBy]);

    // Get campaigns with related data
    const campaignList = await this.db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        conditionCount: campaigns.conditionCount,
        assignedCount: campaigns.assignedCount,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        retries: campaigns.retries,
        retryIntervalMinutes: campaigns.retryIntervalMinutes,
        borrowerType: campaigns.borrowerType,
        segment: campaigns.segment,
        productGroup: campaigns.productGroup,
        productType: campaigns.productType,
        subProductType: campaigns.subProductType,
        productVariant: campaigns.productVariant,
        schemeName: campaigns.schemeName,
        schemeCode: campaigns.schemeCode,
        submittedForApprovalAt: campaigns.submittedForApprovalAt,
        approvedAt: campaigns.approvedAt,
        approvedBy: campaigns.approvedBy,
        rejectedAt: campaigns.rejectedAt,
        rejectedBy: campaigns.rejectedBy,
        rejectionRemarks: campaigns.rejectionRemarks,
        createdBy: campaigns.createdBy,
        updatedBy: campaigns.updatedBy,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        stateName: states.name,
        dpdName: dpdBuckets.name,
        channelName: channels.name,
        templateName: templates.name,
        languageName: languages.name,
      })
      .from(campaigns)
      .leftJoin(states, eq(campaigns.stateId, states.id))
      .leftJoin(dpdBuckets, eq(campaigns.dpdId, dpdBuckets.id))
      .leftJoin(channels, eq(campaigns.channelId, channels.id))
      .leftJoin(templates, eq(campaigns.templateId, templates.id))
      .leftJoin(languages, eq(campaigns.languageId, languages.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await this.db
      .select({ count: campaigns.id })
      .from(campaigns)
      .where(whereClause);

    return {
      campaigns: campaignList,
      total: count,
    };
  }

  async getCampaignForReview(campaignId: number): Promise<CampaignReviewResponseDto> {
    const [campaign] = await this.db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        conditionCount: campaigns.conditionCount,
        assignedCount: campaigns.assignedCount,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        retries: campaigns.retries,
        retryIntervalMinutes: campaigns.retryIntervalMinutes,
        borrowerType: campaigns.borrowerType,
        segment: campaigns.segment,
        productGroup: campaigns.productGroup,
        productType: campaigns.productType,
        subProductType: campaigns.subProductType,
        productVariant: campaigns.productVariant,
        schemeName: campaigns.schemeName,
        schemeCode: campaigns.schemeCode,
        submittedForApprovalAt: campaigns.submittedForApprovalAt,
        approvedAt: campaigns.approvedAt,
        approvedBy: campaigns.approvedBy,
        rejectedAt: campaigns.rejectedAt,
        rejectedBy: campaigns.rejectedBy,
        rejectionRemarks: campaigns.rejectionRemarks,
        createdBy: campaigns.createdBy,
        updatedBy: campaigns.updatedBy,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        stateName: states.name,
        dpdName: dpdBuckets.name,
        channelName: channels.name,
        templateName: templates.name,
        languageName: languages.name,
        createdByName: users.fullName,
      })
      .from(campaigns)
      .leftJoin(states, eq(campaigns.stateId, states.id))
      .leftJoin(dpdBuckets, eq(campaigns.dpdId, dpdBuckets.id))
      .leftJoin(channels, eq(campaigns.channelId, channels.id))
      .leftJoin(templates, eq(campaigns.templateId, templates.id))
      .leftJoin(languages, eq(campaigns.languageId, languages.id))
      .leftJoin(users, eq(campaigns.createdBy, users.id))
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async getApprovalHistory(campaignId: number): Promise<any[]> {
    return this.db
      .select({
        id: approvalAudit.id,
        action: approvalAudit.action,
        remarks: approvalAudit.remarks,
        performedAt: approvalAudit.createdAt,
        performedByName: users.fullName,
      })
      .from(approvalAudit)
      .leftJoin(users, eq(approvalAudit.performedBy, users.id))
      .where(eq(approvalAudit.campaignId, campaignId))
      .orderBy(desc(approvalAudit.createdAt));
  }

  async exportCampaignsForApproval(): Promise<any[]> {
    return this.db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        stateName: states.name,
        dpdName: dpdBuckets.name,
        channelName: channels.name,
        templateName: templates.name,
        languageName: languages.name,
        conditionCount: campaigns.conditionCount,
        assignedCount: campaigns.assignedCount,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        submittedForApprovalAt: campaigns.submittedForApprovalAt,
        createdByName: users.fullName,
      })
      .from(campaigns)
      .leftJoin(states, eq(campaigns.stateId, states.id))
      .leftJoin(dpdBuckets, eq(campaigns.dpdId, dpdBuckets.id))
      .leftJoin(channels, eq(campaigns.channelId, channels.id))
      .leftJoin(templates, eq(campaigns.templateId, templates.id))
      .leftJoin(languages, eq(campaigns.languageId, languages.id))
      .leftJoin(users, eq(campaigns.createdBy, users.id))
      .where(eq(campaigns.status, 'Pending Approval'))
      .orderBy(desc(campaigns.submittedForApprovalAt));
  }
}
