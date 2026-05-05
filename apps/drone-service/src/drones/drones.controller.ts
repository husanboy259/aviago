import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DronesService } from './drones.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, DroneStatus } from '@delidrone/common';
import { CreateDroneDto, UpdateDroneLocationDto, UpdateDroneStatusDto, AssignRouteDto } from '@delidrone/common';

@ApiTags('Drones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drones')
export class DronesController {
  constructor(private readonly svc: DronesService) {}

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List all drones' })
  @ApiQuery({ name: 'status', enum: DroneStatus, required: false })
  findAll(@Query('status') status?: DroneStatus) {
    return this.svc.findAll(status);
  }

  @Get('available')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all idle drones' })
  findAvailable() {
    return this.svc.findAvailable();
  }

  @Get('nearest')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Find nearest available drone to a coordinate' })
  findNearest(@Query('lat') lat: number, @Query('lng') lng: number) {
    return this.svc.findNearestAvailable(lat, lng);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get drone details' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[Admin] Register a new drone' })
  create(@Body() dto: CreateDroneDto) {
    return this.svc.create(dto);
  }

  @Patch(':id/location')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[Operator] Push GPS telemetry update' })
  updateLocation(@Param('id') id: string, @Body() dto: UpdateDroneLocationDto) {
    return this.svc.updateLocation(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[Operator/Admin] Update drone status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDroneStatusDto) {
    return this.svc.updateStatus(id, dto);
  }

  @Patch(':id/assign-route')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[Operator] Assign delivery route' })
  assignRoute(@Param('id') id: string, @Body() dto: AssignRouteDto) {
    return this.svc.assignRoute(id, dto);
  }

  @Patch(':id/complete')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[Operator] Mark delivery complete, reset drone to idle' })
  complete(@Param('id') id: string) {
    return this.svc.completeDelivery(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Delete drone' })
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
