import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { campaigns, campaignFilters, states, dpdBuckets, channels, templates, languages } from '../../database/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignResponseDto } from './dto/campaign-response.dto';

@Injectable()
export class CampaignsService {
  constructor(@Inject('DRIZZLE') private db: any) {}

  async createCampaign(dto: CreateCampaignDto): Promise<CampaignResponseDto> {
    // Validate references exist
    await this.validateReferences(dto);

    // Generate campaign name with better format
    const name = await this.generateCampaignName(dto);

    // Check duplicate
    const exists = await this.db.select().from(campaigns).where(eq(campaigns.name, name));
    if (exists.length > 0) {
      throw new BadRequestException("Campaign name already exists");
    }

    // Calculate filled conditions
    const conditionCount = [
      dto.borrowerType,
      dto.segment,
      dto.productGroup,
      dto.productType,
      dto.subProductType,
      dto.productVariant,
      dto.schemeName,
      dto.schemeCode,
      // key-value filters fallback
      ...(dto.filters ? Object.keys(dto.filters) : [])
    ].filter(Boolean).length;

    const [campaign] = await this.db.insert(campaigns).values({
      name,
      stateId: dto.stateId,
      dpdId: dto.dpdId,
      channelId: dto.channelId,
      templateId: dto.templateId,
      languageId: dto.languageId,
      retries: dto.retries ?? 0,
      retryIntervalMinutes: dto.retryIntervalMinutes ?? 0,
      startDate: dto.startDate,
      endDate: dto.endDate,
      conditionCount,
      borrowerType: dto.borrowerType,
      segment: dto.segment,
      productGroup: dto.productGroup,
      productType: dto.productType,
      subProductType: dto.subProductType,
      productVariant: dto.productVariant,
      schemeName: dto.schemeName,
      schemeCode: dto.schemeCode,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,
    }).returning();

    // Insert filters if provided
    if (dto.filters) {
      for (const [key, value] of Object.entries(dto.filters)) {
        await this.db.insert(campaignFilters).values({
          campaignId: campaign.id,
          key,
          value: value as string,
        });
      }
    }

    return this.getCampaignById(campaign.id);
  }

  async getAllCampaigns(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
    sortBy: 'createdAt' | 'startDate' | 'endDate' | 'name' | 'status' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ campaigns: CampaignResponseDto[], total: number }> {
    const offset = (page - 1) * limit;
    
    const whereParts: any[] = [];
    if (status) whereParts.push(eq(campaigns.status, status));
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      whereParts.push(sql`lower(${campaigns.name}) like ${term}`);
    }
    const whereCondition: any = whereParts.length ? and(...whereParts) : undefined;

    const orderColumn =
      sortBy === 'createdAt' ? campaigns.createdAt :
      sortBy === 'startDate' ? campaigns.startDate :
      sortBy === 'endDate' ? campaigns.endDate :
      sortBy === 'name' ? campaigns.name :
      campaigns.status;

    const orderExpr = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const [campaignsList, totalResult] = await Promise.all([
      this.db
        .select({
          id: campaigns.id,
          name: campaigns.name,
          stateId: campaigns.stateId,
          dpdId: campaigns.dpdId,
          channelId: campaigns.channelId,
          templateId: campaigns.templateId,
          languageId: campaigns.languageId,
          retries: campaigns.retries,
          retryIntervalMinutes: campaigns.retryIntervalMinutes,
          startDate: campaigns.startDate,
          endDate: campaigns.endDate,
          status: campaigns.status,
          conditionCount: campaigns.conditionCount,
          createdBy: campaigns.createdBy,
          updatedBy: campaigns.updatedBy,
          createdAt: campaigns.createdAt,
          updatedAt: campaigns.updatedAt,
        })
        .from(campaigns)
        .where(whereCondition)
        .orderBy(orderExpr)
        .limit(limit)
        .offset(offset),
      
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(campaigns)
        .where(whereCondition)
    ]);

    const total = totalResult[0]?.count || 0;

    // Get filters for each campaign
    const campaignsWithFilters = await Promise.all(
      campaignsList.map(async (campaign) => {
        const filters = await this.db
          .select()
          .from(campaignFilters)
          .where(eq(campaignFilters.campaignId, campaign.id));
        
        return {
          ...campaign,
          filters: filters.map(f => ({ id: f.id, key: f.key, value: f.value }))
        };
      })
    );

    return { campaigns: campaignsWithFilters, total };
  }

  async getCampaignById(id: number): Promise<CampaignResponseDto> {
    const [campaign] = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id));

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    const filters = await this.db
      .select()
      .from(campaignFilters)
      .where(eq(campaignFilters.campaignId, id));

    return {
      ...campaign,
      filters: filters.map(f => ({ id: f.id, key: f.key, value: f.value }))
    };
  }

  async updateCampaign(id: number, dto: UpdateCampaignDto): Promise<CampaignResponseDto> {
    const existingCampaign = await this.getCampaignById(id);
    
    // Validate references if they're being updated
    if (dto.stateId || dto.dpdId || dto.channelId || dto.templateId || dto.languageId) {
      await this.validateReferences(dto as CreateCampaignDto);
    }

    // Generate new name if any key fields changed
    let name = existingCampaign.name;
    if (dto.stateId || dto.dpdId || dto.channelId || dto.templateId || dto.languageId) {
      const updatedDtoForName = {
        stateId: dto.stateId ?? existingCampaign.stateId,
        dpdId: dto.dpdId ?? existingCampaign.dpdId,
        channelId: dto.channelId ?? existingCampaign.channelId,
        templateId: dto.templateId ?? existingCampaign.templateId,
        languageId: dto.languageId ?? existingCampaign.languageId,
      } as CreateCampaignDto;
      name = await this.generateCampaignName(updatedDtoForName);
      
      // Check if new name already exists
      const exists = await this.db.select().from(campaigns).where(and(eq(campaigns.name, name), sql`${campaigns.id} != ${id}`));
      if (exists.length > 0) {
        throw new BadRequestException("Campaign name already exists");
      }
    }

    // Calculate new condition count
    const conditionCount = Object.keys(dto.filters || existingCampaign.filters || {}).length;

    const [updatedCampaign] = await this.db
      .update(campaigns)
      .set({
        ...dto,
        name,
        conditionCount,
        updatedBy: dto.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id))
      .returning();

    // Update filters if provided
    if (dto.filters !== undefined) {
      // Delete existing filters
      await this.db.delete(campaignFilters).where(eq(campaignFilters.campaignId, id));
      
      // Insert new filters
      for (const [key, value] of Object.entries(dto.filters)) {
        await this.db.insert(campaignFilters).values({
          campaignId: id,
          key,
          value: value as string,
        });
      }
    }

    return this.getCampaignById(id);
  }

  async deleteCampaign(id: number): Promise<void> {
    const campaign = await this.getCampaignById(id);
    
    // Delete filters first
    await this.db.delete(campaignFilters).where(eq(campaignFilters.campaignId, id));
    
    // Delete campaign
    await this.db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async getCampaignMetrics(id: number): Promise<any> {
    const campaign = await this.getCampaignById(id);
    
    // This would typically connect to your analytics/metrics system
    // For now, returning basic campaign info with placeholder metrics
    return {
      campaignId: id,
      campaignName: campaign.name,
      status: campaign.status,
      totalTargets: 0, // Placeholder - would come from your targeting system
      delivered: 0,    // Placeholder - would come from your delivery system
      opened: 0,       // Placeholder - would come from your tracking system
      clicked: 0,      // Placeholder - would come from your tracking system
      conversionRate: 0, // Placeholder - calculated metric
    };
  }

  private async validateReferences(dto: CreateCampaignDto): Promise<void> {
    const [stateExists, dpdExists, channelExists, templateExists, languageExists] = await Promise.all([
      this.db.select().from(states).where(eq(states.id, dto.stateId)),
      this.db.select().from(dpdBuckets).where(eq(dpdBuckets.id, dto.dpdId)),
      this.db.select().from(channels).where(eq(channels.id, dto.channelId)),
      this.db.select().from(templates).where(eq(templates.id, dto.templateId)),
      this.db.select().from(languages).where(eq(languages.id, dto.languageId)),
    ]);

    if (stateExists.length === 0) throw new BadRequestException(`State with ID ${dto.stateId} not found`);
    if (dpdExists.length === 0) throw new BadRequestException(`DPD bucket with ID ${dto.dpdId} not found`);
    if (channelExists.length === 0) throw new BadRequestException(`Channel with ID ${dto.channelId} not found`);
    if (templateExists.length === 0) throw new BadRequestException(`Template with ID ${dto.templateId} not found`);
    if (languageExists.length === 0) throw new BadRequestException(`Language with ID ${dto.languageId} not found`);
  }

  private async generateCampaignName(dto: CreateCampaignDto): Promise<string> {
    // Get reference names for better naming
    const [state, dpd, channel, template, language] = await Promise.all([
      this.db.select().from(states).where(eq(states.id, dto.stateId)),
      this.db.select().from(dpdBuckets).where(eq(dpdBuckets.id, dto.dpdId)),
      this.db.select().from(channels).where(eq(channels.id, dto.channelId)),
      this.db.select().from(templates).where(eq(templates.id, dto.templateId)),
      this.db.select().from(languages).where(eq(languages.id, dto.languageId)),
    ]);

    const stateName = state[0]?.name || `State${dto.stateId}`;
    const dpdName = dpd[0]?.name || `DPD${dto.dpdId}`;
    const channelName = channel[0]?.name || `Channel${dto.channelId}`;
    const templateName = template[0]?.name || `Template${dto.templateId}`;
    const languageName = language[0]?.name || `Lang${dto.languageId}`;

    // Generate timestamp for uniqueness
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    return `${stateName}_${channelName}_${dpdName}_${templateName}_${languageName}_${timestamp}`;
  }
}
