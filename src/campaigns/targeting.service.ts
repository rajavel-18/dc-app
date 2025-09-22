import { Injectable, Inject } from '@nestjs/common';
import { campaigns, campaignFilters as campaignFiltersTable, states, dpdBuckets, channels, templates, languages } from '../../database/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export interface TargetingCriteria {
  stateIds?: number[];
  dpdIds?: number[];
  channelIds?: number[];
  templateIds?: number[];
  languageIds?: number[];
  customFilters?: Record<string, string>;
}

export interface TargetingResult {
  campaignId: number;
  campaignName: string;
  targetCount: number;
  criteria: TargetingCriteria;
  metrics: {
    stateCoverage: number;
    dpdCoverage: number;
    channelCoverage: number;
    estimatedReach: number;
  };
}

@Injectable()
export class TargetingService {
  constructor(@Inject('DRIZZLE') private db: any) {}

  /**
   * Find campaigns that match the given targeting criteria
   */
  async findMatchingCampaigns(criteria: TargetingCriteria): Promise<TargetingResult[]> {
    const results: TargetingResult[] = [];

    // Build base query conditions
    const conditions: any[] = [];

    if (criteria.stateIds?.length) {
      conditions.push(inArray(campaigns.stateId, criteria.stateIds));
    }

    if (criteria.dpdIds?.length) {
      conditions.push(inArray(campaigns.dpdId, criteria.dpdIds));
    }

    if (criteria.channelIds?.length) {
      conditions.push(inArray(campaigns.channelId, criteria.channelIds));
    }

    if (criteria.templateIds?.length) {
      conditions.push(inArray(campaigns.templateId, criteria.templateIds));
    }

    if (criteria.languageIds?.length) {
      conditions.push(inArray(campaigns.languageId, criteria.languageIds));
    }

    // Only get active campaigns
    conditions.push(eq(campaigns.status, 'Active'));

    // Get matching campaigns
    const matchingCampaigns = await this.db
      .select()
      .from(campaigns)
      .where(conditions.length ? and(...conditions) : undefined);

    // For each campaign, check custom filters and calculate metrics
    for (const campaign of matchingCampaigns) {
      const campaignFilters = await this.db
        .select()
        .from(campaignFiltersTable)
        .where(eq(campaignFiltersTable.campaignId, campaign.id));

      // Check if custom filters match
      let customFiltersMatch = true;
      if (criteria.customFilters) {
        for (const [key, value] of Object.entries(criteria.customFilters)) {
          const filter = campaignFilters.find(f => f.key === key);
          if (!filter || filter.value !== value) {
            customFiltersMatch = false;
            break;
          }
        }
      }

      if (customFiltersMatch) {
        const metrics = await this.calculateTargetingMetrics(campaign, criteria);
        const targetCount = await this.estimateTargetCount(campaign, criteria);

        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          targetCount,
          criteria,
          metrics,
        });
      }
    }

    return results;
  }

  /**
   * Get targeting suggestions based on partial criteria
   */
  async getTargetingSuggestions(partialCriteria: Partial<TargetingCriteria>): Promise<{
    states: Array<{ id: number; name: string; count: number }>;
    dpdBuckets: Array<{ id: number; name: string; count: number }>;
    channels: Array<{ id: number; name: string; count: number }>;
    templates: Array<{ id: number; name: string; count: number }>;
    languages: Array<{ id: number; name: string; count: number }>;
  }> {
    const conditions: any[] = [];
    
    // Add existing criteria as filters
    if (partialCriteria.stateIds?.length) {
      conditions.push(inArray(campaigns.stateId, partialCriteria.stateIds));
    }
    if (partialCriteria.dpdIds?.length) {
      conditions.push(inArray(campaigns.dpdId, partialCriteria.dpdIds));
    }
    if (partialCriteria.channelIds?.length) {
      conditions.push(inArray(campaigns.channelId, partialCriteria.channelIds));
    }
    if (partialCriteria.templateIds?.length) {
      conditions.push(inArray(campaigns.templateId, partialCriteria.templateIds));
    }
    if (partialCriteria.languageIds?.length) {
      conditions.push(inArray(campaigns.languageId, partialCriteria.languageIds));
    }

    conditions.push(eq(campaigns.status, 'Active'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get counts for each dimension
    const [statesData, dpdData, channelsData, templatesData, languagesData] = await Promise.all([
      this.getDimensionCounts('stateId', states, whereClause),
      this.getDimensionCounts('dpdId', dpdBuckets, whereClause),
      this.getDimensionCounts('channelId', channels, whereClause),
      this.getDimensionCounts('templateId', templates, whereClause),
      this.getDimensionCounts('languageId', languages, whereClause),
    ]);

    return {
      states: statesData,
      dpdBuckets: dpdData,
      channels: channelsData,
      templates: templatesData,
      languages: languagesData,
    };
  }

  /**
   * Analyze campaign performance across different targeting dimensions
   */
  async analyzeCampaignPerformance(campaignId: number): Promise<{
    performance: {
      statePerformance: Array<{ stateId: number; stateName: string; metrics: any }>;
      dpdPerformance: Array<{ dpdId: number; dpdName: string; metrics: any }>;
      channelPerformance: Array<{ channelId: number; channelName: string; metrics: any }>;
    };
    recommendations: string[];
  }> {
    const campaign = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign.length) {
      throw new Error('Campaign not found');
    }

    // This would typically connect to your analytics system
    // For now, returning placeholder data with structure for real implementation
    const performance = {
      statePerformance: [
        { stateId: campaign[0].stateId, stateName: 'Sample State', metrics: { reach: 1000, conversion: 0.05 } }
      ],
      dpdPerformance: [
        { dpdId: campaign[0].dpdId, dpdName: 'Sample DPD', metrics: { reach: 1000, conversion: 0.05 } }
      ],
      channelPerformance: [
        { channelId: campaign[0].channelId, channelName: 'Sample Channel', metrics: { reach: 1000, conversion: 0.05 } }
      ],
    };

    const recommendations = [
      'Consider expanding to additional states with similar demographics',
      'Test different DPD buckets to optimize timing',
      'A/B test different channels for better engagement',
    ];

    return { performance, recommendations };
  }

  private async calculateTargetingMetrics(campaign: any, criteria: TargetingCriteria) {
    // Calculate coverage metrics
    const totalStates = await this.db.select({ count: sql<number>`count(*)` }).from(states);
    const totalDpdBuckets = await this.db.select({ count: sql<number>`count(*)` }).from(dpdBuckets);
    const totalChannels = await this.db.select({ count: sql<number>`count(*)` }).from(channels);

    const stateCoverage = criteria.stateIds?.length ? (criteria.stateIds.length / totalStates[0].count) * 100 : 100;
    const dpdCoverage = criteria.dpdIds?.length ? (criteria.dpdIds.length / totalDpdBuckets[0].count) * 100 : 100;
    const channelCoverage = criteria.channelIds?.length ? (criteria.channelIds.length / totalChannels[0].count) * 100 : 100;

    // Estimate reach based on coverage
    const estimatedReach = Math.round((stateCoverage + dpdCoverage + channelCoverage) / 3);

    return {
      stateCoverage: Math.round(stateCoverage * 100) / 100,
      dpdCoverage: Math.round(dpdCoverage * 100) / 100,
      channelCoverage: Math.round(channelCoverage * 100) / 100,
      estimatedReach,
    };
  }

  private async estimateTargetCount(campaign: any, criteria: TargetingCriteria): Promise<number> {
    // This is a simplified estimation
    // In a real system, this would query your customer database
    // and apply the targeting logic to get actual counts
    
    const baseCount = 1000; // Base customer count
    const stateMultiplier = criteria.stateIds?.length ? criteria.stateIds.length : 1;
    const dpdMultiplier = criteria.dpdIds?.length ? criteria.dpdIds.length : 1;
    const channelMultiplier = criteria.channelIds?.length ? criteria.channelIds.length : 1;
    
    return Math.round(baseCount * stateMultiplier * dpdMultiplier * channelMultiplier);
  }

  private async getDimensionCounts(
    dimensionField: string, 
    dimensionTable: any, 
    whereClause?: any
  ): Promise<Array<{ id: number; name: string; count: number }>> {
    const query = this.db
      .select({
        id: dimensionTable.id,
        name: dimensionTable.name,
        count: sql<number>`count(${campaigns.id})`,
      })
      .from(dimensionTable)
      .leftJoin(campaigns, eq(dimensionTable.id, campaigns[dimensionField]))
      .groupBy(dimensionTable.id, dimensionTable.name);

    if (whereClause) {
      query.where(whereClause);
    }

    return query;
  }
}

