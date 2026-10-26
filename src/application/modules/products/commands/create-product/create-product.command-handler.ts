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
import { generateSku, resolveProductUnitConfiguration } from '../../helpers';
import { CreateProductCommand } from './create-product.command';

@CommandHandlerStrict(CreateProductCommand)
export class CreateProductCommandHandler implements ICommandHandler<CreateProductCommand, Product> {
  constructor(
    @Inject(PRODUCT_REPO) private readonly repo: IProductRepo,
    @Inject(PRODUCT_UNIT_REPO) private readonly productUnitRepo: IProductUnitRepo,
    private readonly activityLogger: ProductActivityLogger,
    private readonly activityLog: ActivityLogService,
    @InjectMapper() private readonly mapper: Mapper,
    @InjectPinoLogger(CreateProductCommandHandler.name) private readonly logger: PinoLogger,
  ) {}

  public async execute(command: CreateProductCommand): Promise<Product> {
    this.logger.info(`Executing ${CreateProductCommand.name}`);
    const unitConfiguration = resolveProductUnitConfiguration(command);
    if (unitConfiguration) {
      await this.productUnitRepo.validateConfigurationAsync(
        command.organizationId,
        unitConfiguration.units,
        unitConfiguration.baseUnitId,
        unitConfiguration.defaultSaleUnitId,
        unitConfiguration.defaultPurchaseUnitId,
      );
      command.baseUnitId = unitConfiguration.baseUnitId;
      command.defaultSaleUnitId = unitConfiguration.defaultSaleUnitId;
      command.defaultPurchaseUnitId = unitConfiguration.defaultPurchaseUnitId;
    }
    const product = this.mapper.map(command, CreateProductCommand, Product);
    if (!product.sku) {
      const count = await this.repo.countAsync({ organizationId: command.organizationId });
      product.sku = generateSku(command.name ?? '', count + 1);
    }
    const created = await this.repo.createAsync(product);

    if (unitConfiguration) {
      await this.productUnitRepo.syncForProductAsync(
        created.id,
        command.organizationId,
        unitConfiguration.units,
        unitConfiguration.baseUnitId,
        unitConfiguration.defaultSaleUnitId,
        unitConfiguration.defaultPurchaseUnitId,
      );
    }

    const entry = Object.assign(new ProductLogEntry(), {
      action:         EProductLogAction.ProductCreated,
      organizationId: created.organizationId,
      productId:      created.id,
      performedById:  command.createdById,
    });
    await this.activityLogger.log(entry);
    this.activityLog.record({
      action: EActivityAction.ProductCreated,
      entityType: 'Product',
      entityId: created.id,
      actorId: command.createdById,
      organizationId: created.organizationId,
      metadata: { name: created.name, sku: created.sku },
    });

    return this.repo.getAsync(created.id);
  }
}
