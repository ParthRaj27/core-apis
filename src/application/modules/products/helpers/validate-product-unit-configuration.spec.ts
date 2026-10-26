import { BadRequestException } from '@nestjs/common';
import { validateProductUnitConfiguration } from './validate-product-unit-configuration';

describe('validateProductUnitConfiguration', () => {
  const kg = 'kg';
  const bag = 'bag';

  it('accepts a base unit plus a product-specific package conversion', () => {
    expect(() => validateProductUnitConfiguration([
      { unitId: kg, conversionFactor: '1' },
      { unitId: bag, conversionFactor: '10', allowedForPurchase: true, allowedForSale: true },
    ], kg, kg, bag)).not.toThrow();
  });

  it('rejects a non-one base conversion', () => {
    expect(() => validateProductUnitConfiguration([
      { unitId: kg, conversionFactor: '2' },
      { unitId: bag, conversionFactor: '10' },
    ], kg)).toThrow(new BadRequestException('Base unit conversion factor must be 1'));
  });

  it('rejects an operation default that is not enabled', () => {
    expect(() => validateProductUnitConfiguration([
      { unitId: kg, conversionFactor: '1' },
      { unitId: bag, conversionFactor: '10', allowedForSale: false },
    ], kg, bag)).toThrow(new BadRequestException('Default sale unit must be active and enabled for sale'));
  });

  it.each(['0', '-1', '1.000000001', 'not-a-number'])('rejects invalid factor %s', (conversionFactor) => {
    expect(() => validateProductUnitConfiguration([
      { unitId: kg, conversionFactor: '1' },
      { unitId: bag, conversionFactor },
    ], kg)).toThrow(BadRequestException);
  });
});
