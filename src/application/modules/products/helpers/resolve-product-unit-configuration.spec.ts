import { BadRequestException } from '@nestjs/common';
import { resolveProductUnitConfiguration } from './resolve-product-unit-configuration';

describe('resolveProductUnitConfiguration', () => {
  it('resolves structured product conversions and base defaults', () => {
    expect(resolveProductUnitConfiguration({
      baseUnitId: 'kg',
      units: [
        { unitId: 'kg', conversionFactor: '1' },
        { unitId: 'bag', conversionFactor: '10' },
      ],
    })).toEqual({
      baseUnitId: 'kg',
      defaultSaleUnitId: 'kg',
      defaultPurchaseUnitId: 'kg',
      units: [
        { unitId: 'kg', conversionFactor: '1' },
        { unitId: 'bag', conversionFactor: '10' },
      ],
    });
  });

  it('requires a base unit for the structured contract', () => {
    expect(() => resolveProductUnitConfiguration({
      units: [{ unitId: 'bag', conversionFactor: '10' }],
    })).toThrow(new BadRequestException('Base unit is required when product units are configured'));
  });

  it('keeps legacy unit associations compatible with factor one', () => {
    expect(resolveProductUnitConfiguration({ unitIds: ['piece'], defaultUnitId: 'piece' })).toEqual({
      baseUnitId: 'piece',
      defaultSaleUnitId: 'piece',
      defaultPurchaseUnitId: 'piece',
      units: [{ unitId: 'piece', conversionFactor: '1' }],
    });
  });
});
