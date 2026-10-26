import { BadRequestException } from '@nestjs/common';
import { ProductUnitConfiguration } from '../i-product-unit.repo';

export function validateProductUnitConfiguration(
  units: ProductUnitConfiguration[],
  baseUnitId: string,
  defaultSaleUnitId?: string,
  defaultPurchaseUnitId?: string,
): void {
  if (!units.length) throw new BadRequestException('At least one product unit is required');
  const ids = units.map((unit) => unit.unitId);
  if (new Set(ids).size !== ids.length) throw new BadRequestException('Product units cannot contain duplicates');

  const byId = new Map(units.map((unit) => [unit.unitId, unit]));
  const base = byId.get(baseUnitId);
  if (!base) throw new BadRequestException('Base unit must be included in product units');
  if (base.isActive === false) throw new BadRequestException('Base unit conversion must be active');
  if (!isOne(base.conversionFactor)) throw new BadRequestException('Base unit conversion factor must be 1');
  validateDefault(byId, defaultSaleUnitId, 'sale');
  validateDefault(byId, defaultPurchaseUnitId, 'purchase');

  const barcodes = units.map((unit) => unit.barcode?.trim()).filter((barcode): barcode is string => Boolean(barcode));
  if (new Set(barcodes).size !== barcodes.length) throw new BadRequestException('Product unit barcodes cannot contain duplicates');
  for (const unit of units) validateConversionFactor(unit.conversionFactor);
}

export function normalizeConversionFactor(value: string): string {
  validateConversionFactor(value);
  const [whole, fraction = ''] = value.split('.');
  const trimmedFraction = fraction.replace(/0+$/, '');
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

const DECIMAL_PATTERN = /^\d+(?:\.\d{1,8})?$/;

function validateConversionFactor(value: string): void {
  if (!DECIMAL_PATTERN.test(value) || !/[1-9]/.test(value)) {
    throw new BadRequestException('Conversion factor must be a positive decimal with at most 8 decimal places');
  }
}

function isOne(value: string): boolean {
  return normalizeConversionFactor(value) === '1';
}

function validateDefault(
  units: Map<string, ProductUnitConfiguration>,
  unitId: string | undefined,
  operation: 'sale' | 'purchase',
): void {
  if (!unitId) return;
  const unit = units.get(unitId);
  const allowed = operation === 'sale' ? unit?.allowedForSale !== false : unit?.allowedForPurchase !== false;
  if (!unit || unit.isActive === false || !allowed) {
    throw new BadRequestException(`Default ${operation} unit must be active and enabled for ${operation}`);
  }
}
