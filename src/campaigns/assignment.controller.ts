import { Controller, Post, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';

@Controller('campaigns')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  // Allow Admin and System to trigger assignment
  @Roles('Admin', 'System')
  @Post(':id/assign')
  assign(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.assignCampaign(id);
  }
}


