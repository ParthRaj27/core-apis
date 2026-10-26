import { Inject } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CommandHandlerStrict } from '../../../../../common';
import { ORGANIZATION_UNIT_REPO } from '../../../../constants';
import { EQuantityRoundingMode, OrganizationUnit } from '../../domain';
import { IOrganizationUnitRepo } from '../../i-organization-unit.repo';
import { CreateOrganizationUnitCommand } from './create-organization-unit.command';
import { validateQuantityUnitRules } from '../../helpers';

@CommandHandlerStrict(CreateOrganizationUnitCommand)
export class CreateOrganizationUnitCommandHandler implements ICommandHandler<CreateOrganizationUnitCommand, OrganizationUnit> {
  constructor(
    @Inject(ORGANIZATION_UNIT_REPO) private readonly repo: IOrganizationUnitRepo,
    @InjectMapper() private readonly mapper: Mapper,
    @InjectPinoLogger(CreateOrganizationUnitCommandHandler.name) private readonly logger: PinoLogger,
  ) {}

  public async execute(command: CreateOrganizationUnitCommand): Promise<OrganizationUnit> {
    this.logger.info(`Executing ${CreateOrganizationUnitCommand.name}`);
    const unit = this.mapper.map(command, CreateOrganizationUnitCommand, OrganizationUnit);
    unit.quantityPrecision ??= 4;
    unit.allowFraction ??= true;
    unit.roundingMode ??= EQuantityRoundingMode.Nearest;
    unit.quantityIncrement ??= '1';
    validateQuantityUnitRules(unit);
    return this.repo.createAsync(unit);
  }
}
