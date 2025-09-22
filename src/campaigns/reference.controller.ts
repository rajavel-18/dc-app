import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReferenceService } from './reference.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';

@Controller('reference')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReferenceController {
  constructor(private readonly ref: ReferenceService) {}

  @Roles('Admin', 'Checker', 'Executor')
  @Get('states')
  states() { return this.ref.getStates(); }

  @Roles('Admin', 'Checker', 'Executor')
  @Get('dpd')
  dpd() { return this.ref.getDpd(); }

  @Roles('Admin', 'Checker', 'Executor')
  @Get('channels')
  channels() { return this.ref.getChannels(); }

  @Roles('Admin', 'Checker', 'Executor')
  @Get('languages')
  languages() { return this.ref.getLanguages(); }

  @Roles('Admin', 'Checker', 'Executor')
  @Get('templates')
  templates(@Query('channelId') channelId?: string) {
    return this.ref.getTemplates(channelId ? Number(channelId) : undefined);
  }
}




