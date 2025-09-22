import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  ValidationPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('campaigns')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Roles('Admin', 'User') // Both Admin and User can view
  @Get()
  async getAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'startDate' | 'endDate' | 'name' | 'status',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.campaignsService.getAllCampaigns(page, limit, status, search, sortBy, sortOrder);
  }

  @Roles('Admin', 'User')
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.campaignsService.getCampaignById(id);
  }

  @Roles('Admin', 'User')
  @Get(':id/metrics')
  async getMetrics(@Param('id', ParseIntPipe) id: number) {
    return this.campaignsService.getCampaignMetrics(id);
  }

  // Approval-ready: list Draft campaigns with search/sort
  @Roles('Admin', 'Checker')
  @Get('approval-ready/list')
  async approvalReady(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'startDate' | 'endDate' | 'name' | 'status',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.campaignsService.getAllCampaigns(page, limit, 'Draft', search, sortBy, sortOrder);
  }

  @Roles('Admin') // only Admin can create
  @Post()
  async create(@Body(ValidationPipe) dto: CreateCampaignDto, @Request() req: any) {
    dto.createdBy = req.user.userId;
    dto.updatedBy = req.user.userId;
    return this.campaignsService.createCampaign(dto);
  }

  @Roles('Admin') // only Admin can update
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body(ValidationPipe) dto: UpdateCampaignDto, 
    @Request() req: any
  ) {
    dto.updatedBy = req.user.userId;
    return this.campaignsService.updateCampaign(id, dto);
  }

  @Roles('Admin') // only Admin can delete
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.campaignsService.deleteCampaign(id);
    return { message: 'Campaign deleted successfully' };
  }
}
