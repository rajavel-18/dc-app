import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { campaigns, customers, campaignAssignments, assignmentAudit } from '../../database/schema';
import { eq, and, sql } from 'drizzle-orm';

@Injectable()
export class AssignmentService {
  constructor(@Inject('DRIZZLE') private db: any) {}

  async assignCampaign(campaignId: number) {
    // Load campaign
    const [campaign] = await this.db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    if (!campaign) throw new BadRequestException('Campaign not found');
    if (campaign.status !== 'Active') throw new BadRequestException('Campaign must be Active to assign');

    // Build customer match conditions
    const conditions: any[] = [
      eq(customers.stateId, campaign.stateId),
      eq(customers.dpdId, campaign.dpdId),
    ];

    if (campaign.borrowerType) conditions.push(eq(customers.borrowerType, campaign.borrowerType));
    if (campaign.segment) conditions.push(eq(customers.segment, campaign.segment));
    if (campaign.productGroup) conditions.push(eq(customers.productGroup, campaign.productGroup));
    if (campaign.productType) conditions.push(eq(customers.productType, campaign.productType));
    if (campaign.subProductType) conditions.push(eq(customers.subProductType, campaign.subProductType));
    if (campaign.productVariant) conditions.push(eq(customers.productVariant, campaign.productVariant));
    if (campaign.schemeName) conditions.push(eq(customers.schemeName, campaign.schemeName));
    if (campaign.schemeCode) conditions.push(eq(customers.schemeCode, campaign.schemeCode));

    const whereClause = and(...conditions);

    // Fetch matching customers (skip already assigned to this campaign)
    const matches = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(whereClause);

    if (!matches.length) {
      await this.db.insert(assignmentAudit).values({
        campaignId,
        action: 'NO_MATCH',
        details: 'No customers matched campaign filters',
      });
      await this.db.update(campaigns).set({ status: 'NoMatchFound', assignedCount: 0 }).where(eq(campaigns.id, campaignId));
      return { assigned: 0, status: 'NoMatchFound' };
    }

    // Insert assignments (avoid duplicates via NOT EXISTS)
    let assigned = 0;
    for (const row of matches) {
      // Could optimize with a single insert-select in SQL; loop is simple for now
      await this.db.insert(campaignAssignments).values({ campaignId, customerId: row.id });
      assigned += 1;
    }

    // Update campaign counts and status
    await this.db.update(campaigns).set({ assignedCount: assigned, status: 'Assigned' }).where(eq(campaigns.id, campaignId));

    await this.db.insert(assignmentAudit).values({
      campaignId,
      action: 'ASSIGN',
      details: `Assigned ${assigned} customers`,
    });

    return { assigned, status: 'Assigned' };
  }
}


