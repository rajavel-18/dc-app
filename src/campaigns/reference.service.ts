import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { states, dpdBuckets, channels, templates, languages } from '../../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ReferenceService {
  constructor(@Inject('DRIZZLE') private db: any) {}

  async getStates() {
    return this.db.select().from(states).orderBy(states.name);
  }

  async getDpd() {
    return this.db.select().from(dpdBuckets).orderBy(dpdBuckets.name);
  }

  async getChannels() {
    return this.db.select().from(channels).orderBy(channels.name);
  }

  async getLanguages() {
    return this.db.select().from(languages).orderBy(languages.name);
  }

  async getTemplates(channelId?: number) {
    const q = this.db.select().from(templates);
    if (channelId) {
      return this.db.select().from(templates).where(eq(templates.channelId, channelId));
    }
    return q;
  }
}




