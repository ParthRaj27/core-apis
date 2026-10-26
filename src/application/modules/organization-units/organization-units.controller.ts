import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthenticatedUser, ClerkAuthGuard, CqrsMediator, CurrentUser, Roles, RolesGuard, assertOrgOwnership } from '../../../common';
import { ERole } from '../../../infrastructure';
import { CreateOrganizationUnitCommand, DeleteOrganizationUnitCommand, UpdateOrganizationUnitCommand } from './commands';
import { OrganizationUnit } from './domain';
import { CreateOrganizationUnitRequest, ListOrganizationUnitsRequest, OrganizationUnitResponse, UpdateOrganizationUnitRequest } from './models';
import { GetOrganizationUnitQuery, ListOrganizationUnitsQuery } from './queries';

@ApiBearerAuth()
@ApiTags('Organization Units')
@Controller({ path: 'organization-units', version: '1' })
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(ERole.OrgAdmin, ERole.SuperAdmin, ERole.BranchManager)
export class OrganizationUnitsController {
  constructor(
    protected readonly mediator: CqrsMediator,
    @InjectMapper() protected readonly mapper: Mapper,
    @InjectPinoLogger(OrganizationUnitsController.name) protected readonly logger: PinoLogger,
  ) {}

  @ApiOperation({ summary: 'List all units for this organization' })
  @ApiOkResponse({ type: [OrganizationUnitResponse] })
  @HttpCode(HttpStatus.OK)
  @Get()
  public async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter?: ListOrganizationUnitsRequest,
  ): Promise<OrganizationUnitResponse[]> {
    const query = this.mapper.map(filter, ListOrganizationUnitsRequest, ListOrganizationUnitsQuery);
    query.organizationId = user.organizationId;
    const result = await this.mediator.execute<ListOrganizationUnitsQuery, OrganizationUnit[]>(query);
    return this.mapper.mapArray(result, OrganizationUnit, OrganizationUnitResponse);
  }

  @ApiOperation({ summary: 'Get organization unit by ID' })
  @ApiOkResponse({ type: OrganizationUnitResponse })
  @ApiParam({ name: 'id', description: 'Unit UUID' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  public async getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<OrganizationUnitResponse> {
    const query = new GetOrganizationUnitQuery();
    query.id = id;
    const result = await this.mediator.execute<GetOrganizationUnitQuery, OrganizationUnit>(query);
    assertOrgOwnership(user, result.organizationId, 'OrganizationUnit');
    return this.mapper.map(result, OrganizationUnit, OrganizationUnitResponse);
  }

  @ApiOperation({ summary: 'Create a new organization unit' })
  @ApiCreatedResponse({ type: OrganizationUnitResponse })
  @HttpCode(HttpStatus.CREATED)
  @Roles(ERole.OrgAdmin, ERole.SuperAdmin)
  @Post()
  public async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateOrganizationUnitRequest,
  ): Promise<OrganizationUnitResponse> {
    const command = this.mapper.map(body, CreateOrganizationUnitRequest, CreateOrganizationUnitCommand);
    command.organizationId = user.organizationId;
    const result = await this.mediator.execute<CreateOrganizationUnitCommand, OrganizationUnit>(command);
    return this.mapper.map(result, OrganizationUnit, OrganizationUnitResponse);
  }

  @ApiOperation({ summary: 'Update an organization unit' })
  @ApiOkResponse({ type: OrganizationUnitResponse })
  @ApiParam({ name: 'id', description: 'Unit UUID' })
  @HttpCode(HttpStatus.OK)
  @Roles(ERole.OrgAdmin, ERole.SuperAdmin)
  @Put(':id')
  public async update(
    @Param('id') id: string,
    @Body() body: UpdateOrganizationUnitRequest,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizationUnitResponse> {
    const fetchQuery = new GetOrganizationUnitQuery();
    fetchQuery.id = id;
    const existing = await this.mediator.execute<GetOrganizationUnitQuery, OrganizationUnit>(fetchQuery);
    assertOrgOwnership(user, existing.organizationId, 'OrganizationUnit');
    const command = this.mapper.map(body, UpdateOrganizationUnitRequest, UpdateOrganizationUnitCommand);
    command.id    = id;
    const result  = await this.mediator.execute<UpdateOrganizationUnitCommand, OrganizationUnit>(command);
    return this.mapper.map(result, OrganizationUnit, OrganizationUnitResponse);
  }

  @ApiOperation({ summary: 'Delete an organization unit' })
  @ApiOkResponse({ type: Boolean })
  @ApiParam({ name: 'id', description: 'Unit UUID' })
  @HttpCode(HttpStatus.OK)
  @Roles(ERole.OrgAdmin, ERole.SuperAdmin)
  @Delete(':id')
  public async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<boolean> {
    const fetchQuery = new GetOrganizationUnitQuery();
    fetchQuery.id = id;
    const existing = await this.mediator.execute<GetOrganizationUnitQuery, OrganizationUnit>(fetchQuery);
    assertOrgOwnership(user, existing.organizationId, 'OrganizationUnit');
    const command = new DeleteOrganizationUnitCommand();
    command.id    = id;
    return this.mediator.execute<DeleteOrganizationUnitCommand, boolean>(command);
  }
}
