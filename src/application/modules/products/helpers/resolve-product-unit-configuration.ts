import { BadRequestException } from '@nestjs/common';
import { ProductUnitConfiguration } from '../i-product-unit.repo';

interface ProductUnitInput {
  units?: ProductUnitConfiguration[];
  unitIds?: string[];
  defaultUnitId?: string;
  baseUnitId?: string;
  defaultSaleUnitId?: string;
  defaultPurchaseUnitId?: string;
}

export interface ResolvedProductUnitConfiguration {
  units: ProductUnitConfiguration[];
  baseUnitId: string;
  defaultSaleUnitId: string;
  defaultPurchaseUnitId: string;
}

export function resolveProductUnitConfiguration(input: ProductUnitInput): ResolvedProductUnitConfiguration | undefined {
  if (input.units !== undefined) {
    if (!input.baseUnitId) throw new BadRequestException('Base unit is required when product units are configured');
    return {
      units: input.units,
      baseUnitId: input.baseUnitId,
      defaultSaleUnitId: input.defaultSaleUnitId ?? input.baseUnitId,
      defaultPurchaseUnitId: input.defaultPurchaseUnitId ?? input.baseUnitId,
    };
  }

  if (input.unitIds !== undefined) {
    if (!input.unitIds.length) return undefined;
    const baseUnitId = input.defaultUnitId ?? input.unitIds[0];
    return {
      units: input.unitIds.map((unitId) => ({ unitId, conversionFactor: '1' })),
      baseUnitId,
      defaultSaleUnitId: baseUnitId,
      defaultPurchaseUnitId: baseUnitId,
    };
  }

  return undefined;
}
