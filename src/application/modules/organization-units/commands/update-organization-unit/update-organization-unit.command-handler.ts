import { Inject } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CommandHandlerStrict } from '../../../../../common';
import { ORGANIZATION_UNIT_REPO } from '../../../../constants';
import { OrganizationUnit } from '../../domain';
import { IOrganizationUnitRepo } from '../../i-organization-unit.repo';
import { UpdateOrganizationUnitCommand } from './update-organization-unit.command';
import { validateQuantityUnitRules } from '../../helpers';

@CommandHandlerStrict(UpdateOrganizationUnitCommand)
export class UpdateOrganizationUnitCommandHandler implements ICommandHandler<UpdateOrganizationUnitCommand, OrganizationUnit> {
  constructor(
    @Inject(ORGANIZATION_UNIT_REPO) private readonly repo: IOrganizationUnitRepo,
    @InjectMapper() private readonly mapper: Mapper,
    @InjectPinoLogger(UpdateOrganizationUnitCommandHandler.name) private readonly logger: PinoLogger,
  ) {}

  public async execute(command: UpdateOrganizationUnitCommand): Promise<OrganizationUnit> {
    this.logger.info(`Executing ${UpdateOrganizationUnitCommand.name} id=${command.id}`);
    const existing = await this.repo.getAsync(command.id);
    const patch    = this.mapper.map(command, UpdateOrganizationUnitCommand, OrganizationUnit);

    (Object.keys(patch) as Array<keyof OrganizationUnit>).forEach((key) => {
      if (patch[key] !== undefined && patch[key] !== existing[key]) {
        (existing as unknown as Record<string, unknown>)[key] = patch[key];
      }
    });

    validateQuantityUnitRules(existing);

    return this.repo.updateAsync(existing);
  }
}
