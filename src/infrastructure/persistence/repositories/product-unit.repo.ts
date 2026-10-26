import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { In, Not, Repository } from 'typeorm';
import { BaseRepo, Filter } from '../../../common';
import {
  BillItemEntity,
  InventoryEntity,
  OrderItemEntity,
  OrganizationUnitEntity,
  ProductEntity,
  ProductUnitEntity,
  PurchaseItemEntity,
  QuotationItemEntity,
  StockMovementEntity,
} from '../entities';
import { ProductUnit } from '../../../application/modules/products/domain';
import { IProductUnitRepo, ProductUnitConfiguration, ProductUnitFilter } from 'src/application/modules/products/i-product-unit.repo';
import { normalizeConversionFactor, validateProductUnitConfiguration } from '../../../application/modules/products/helpers';

@Injectable()
export class ProductUnitRepo
  extends BaseRepo<ProductUnitEntity, ProductUnit, string, Filter<ProductUnitFilter>, Filter<ProductUnitFilter>>
  implements IProductUnitRepo
{
  constructor(
    @InjectRepository(ProductUnitEntity) internalRepo: Repository<ProductUnitEntity>,
    @InjectMapper() mapper: Mapper,
    @InjectPinoLogger(ProductUnitRepo.name) logger: PinoLogger,
  ) {
    super(internalRepo, mapper, logger, ProductUnitEntity, ProductUnit);
  }

  public override get idColumnName(): keyof ProductUnitEntity {
    return 'id';
  }

  public async validateConfigurationAsync(
    organizationId: string,
    units: ProductUnitConfiguration[],
    baseUnitId: string,
    defaultSaleUnitId?: string,
    defaultPurchaseUnitId?: string,
    productId?: string,
  ): Promise<void> {
    const ids = units.map((unit) => unit.unitId);
    validateProductUnitConfiguration(units, baseUnitId, defaultSaleUnitId, defaultPurchaseUnitId);

    const orgUnits = await this.internalRepo.manager.find(OrganizationUnitEntity, {
      where: { id: In(ids), organizationId, isActive: true },
    });
    if (orgUnits.length !== ids.length) {
      throw new BadRequestException('Every product unit must be active and belong to the organization');
    }
    const barcodes = units.map((unit) => unit.barcode?.trim()).filter((barcode): barcode is string => Boolean(barcode));
    if (barcodes.length) {
      const barcodeInUse = await this.internalRepo.exists({
        where: { organizationId, ...(productId ? { productId: Not(productId) } : {}), barcode: In(barcodes), isActive: true },
      });
      if (barcodeInUse) throw new BadRequestException('A product unit barcode is already used in this organization');
    }

  }

  public async validateBaseUnitChangeAsync(productId: string, baseUnitId: string): Promise<void> {
    const manager = this.internalRepo.manager;
    const product = await manager.findOneBy(ProductEntity, { id: productId });
    if (!product?.baseUnitId || product.baseUnitId === baseUnitId) return;
    const references = await Promise.all([
      manager.exists(InventoryEntity, { where: { productId } }),
      manager.exists(StockMovementEntity, { where: { productId } }),
      manager.exists(OrderItemEntity, { where: { productId } }),
      manager.exists(BillItemEntity, { where: { productId } }),
      manager.exists(PurchaseItemEntity, { where: { productId } }),
      manager.exists(QuotationItemEntity, { where: { productId } }),
    ]);
    if (references.some(Boolean)) {
      throw new BadRequestException('Base unit cannot be changed after inventory or transactions exist');
    }
  }

  public async syncForProductAsync(
    productId: string,
    organizationId: string,
    units: ProductUnitConfiguration[],
    baseUnitId: string,
    defaultSaleUnitId?: string,
    defaultPurchaseUnitId?: string,
  ): Promise<void> {
    this.logger.info(`Syncing units for product ${productId}`);
    await this.validateConfigurationAsync(organizationId, units, baseUnitId, defaultSaleUnitId, defaultPurchaseUnitId, productId);
    await this.internalRepo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(ProductUnitEntity);
      const existing = await repo.find({ where: { productId } });
      const incomingIds = new Set(units.map((unit) => unit.unitId));
      const now = new Date();

      for (const row of existing) {
        if (!incomingIds.has(row.unitId) && row.isActive) {
          row.isActive = false;
          row.retiredAt = now;
          row.isDefault = false;
          await repo.save(row);
        }
      }

      for (const unit of units) {
        const row = existing.find((item) => item.unitId === unit.unitId) ?? repo.create({ productId, organizationId, unitId: unit.unitId });
        repo.merge(row, {
          organizationId,
          conversionFactor: normalizeConversionFactor(unit.conversionFactor),
          allowedForSale: unit.allowedForSale ?? true,
          allowedForPurchase: unit.allowedForPurchase ?? true,
          barcode: unit.barcode?.trim() || null,
          isActive: unit.isActive ?? true,
          retiredAt: (unit.isActive ?? true) ? null : (row.retiredAt ?? now),
          isDefault: unit.unitId === defaultSaleUnitId,
        });
        await repo.save(row);
      }

      await manager.update(ProductEntity, { id: productId, organizationId }, {
        baseUnitId,
        defaultSaleUnitId: defaultSaleUnitId ?? baseUnitId,
        defaultPurchaseUnitId: defaultPurchaseUnitId ?? baseUnitId,
      });
    });
  }
}
