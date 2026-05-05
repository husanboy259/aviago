import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@delidrone/common';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';

@ApiTags('Menu')
@Controller('restaurants/:restaurantId/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Get menu grouped by category' })
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.menuService.findByRestaurant(restaurantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Add menu item' })
  create(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menuService.create(restaurantId, user.id, user.role, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update menu item' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.update(id, user.id, user.role, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle item availability' })
  toggle(@Param('id') id: string, @CurrentUser() user: any) {
    return this.menuService.toggleAvailability(id, user.id, user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete menu item' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.menuService.remove(id, user.id, user.role);
  }
}
