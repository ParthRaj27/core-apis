import { Inject } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CommandHandlerStrict } from 'src/common';
import { PRODUCT_REPO, PRODUCT_UNIT_REPO } from '../../../../constants';
import { Product } from '../../domain';
import { IProductRepo } from '../..';
import { IProductUnitRepo } from '../../i-product-unit.repo';
import { EProductLogAction } from 'src/application/shared/enums/e-product-log-action.enum';
import { ActivityLogService, ProductActivityLogger, ProductLogEntry } from 'src/application/shared';
import { EActivityAction } from 'src/infrastructure/persistence/entities/activity-log.entity';
import { UpdateProductCommand } from './update-product.command';
import { resolveProductUnitConfiguration } from '../../helpers';

@CommandHandlerStrict(UpdateProductCommand)
export class UpdateProductCommandHandler implements ICommandHandler<UpdateProductCommand, Product> {
  constructor(
    @Inject(PRODUCT_REPO) private readonly repo: IProductRepo,
    @Inject(PRODUCT_UNIT_REPO) private readonly productUnitRepo: IProductUnitRepo,
    private readonly activityLogger: ProductActivityLogger,
    private readonly activityLog: ActivityLogService,
    @InjectMapper() private readonly mapper: Mapper,
    @InjectPinoLogger(UpdateProductCommandHandler.name) private readonly logger: PinoLogger,
  ) {}

  public async execute(command: UpdateProductCommand): Promise<Product> {
    this.logger.info(`Executing ${UpdateProductCommand.name} id=${command.id}`);
    const existing    = await this.repo.getAsync(command.id);
    const unitConfiguration = resolveProductUnitConfiguration(command);
    if (unitConfiguration) {
      await this.productUnitRepo.validateBaseUnitChangeAsync(command.id, unitConfiguration.baseUnitId);
      await this.productUnitRepo.validateConfigurationAsync(
        existing.organizationId,
        unitConfiguration.units,
        unitConfiguration.baseUnitId,
        unitConfiguration.defaultSaleUnitId,
        unitConfiguration.defaultPurchaseUnitId,
        command.id,
      );
      command.baseUnitId = unitConfiguration.baseUnitId;
      command.defaultSaleUnitId = unitConfiguration.defaultSaleUnitId;
      command.defaultPurchaseUnitId = unitConfiguration.defaultPurchaseUnitId;
    }
    const patch       = this.mapper.map(command, UpdateProductCommand, Product);
    const changedFields: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];

    (Object.keys(patch) as Array<keyof Product>).forEach((key) => {
      if (patch[key] !== undefined && patch[key] !== existing[key]) {
        changedFields.push({ field: key, oldValue: existing[key], newValue: patch[key] });
        (existing as unknown as Record<string, unknown>)[key] = patch[key];
        if (key === 'taxId') {
          (existing as unknown as Record<string, unknown>)['tax'] = null;
        }
      }
    });

    await this.repo.updateAsync(existing);

    if (unitConfiguration) {
      await this.productUnitRepo.syncForProductAsync(
        command.id,
        existing.organizationId,
        unitConfiguration.units,
        unitConfiguration.baseUnitId,
        unitConfiguration.defaultSaleUnitId,
        unitConfiguration.defaultPurchaseUnitId,
      );
    }

    if (changedFields.length > 0) {
      const entry = Object.assign(new ProductLogEntry(), {
        action:         EProductLogAction.ProductUpdated,
        organizationId: existing.organizationId,
        productId:      existing.id,
        changedFields,
      });
      await this.activityLogger.log(entry);
      this.activityLog.record({
        action: EActivityAction.ProductUpdated,
        entityType: 'Product',
        entityId: existing.id,
        organizationId: existing.organizationId,
        metadata: { changedFields },
      });
    }

    return this.repo.getAsync(command.id);
  }
}
