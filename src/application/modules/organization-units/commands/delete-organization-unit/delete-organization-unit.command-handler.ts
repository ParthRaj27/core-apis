import { Inject } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CommandHandlerStrict } from '../../../../../common';
import { ORGANIZATION_UNIT_REPO } from '../../../../constants';
import { IOrganizationUnitRepo } from '../../i-organization-unit.repo';
import { DeleteOrganizationUnitCommand } from './delete-organization-unit.command';

@CommandHandlerStrict(DeleteOrganizationUnitCommand)
export class DeleteOrganizationUnitCommandHandler implements ICommandHandler<DeleteOrganizationUnitCommand, boolean> {
  constructor(
    @Inject(ORGANIZATION_UNIT_REPO) private readonly repo: IOrganizationUnitRepo,
    @InjectPinoLogger(DeleteOrganizationUnitCommandHandler.name) private readonly logger: PinoLogger,
  ) {}

  public async execute(command: DeleteOrganizationUnitCommand): Promise<boolean> {
    this.logger.info(`Executing ${DeleteOrganizationUnitCommand.name} id=${command.id}`);
    if (await this.repo.isInUseAsync(command.id)) {
      const unit = await this.repo.getAsync(command.id);
      unit.isActive = false;
      await this.repo.updateAsync(unit);
      return true;
    }
    await this.repo.deleteAsync(command.id);
    return true;
  }
}
