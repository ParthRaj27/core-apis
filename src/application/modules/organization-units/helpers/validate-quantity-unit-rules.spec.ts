import { BadRequestException } from '@nestjs/common';
import { validateQuantityUnitRules } from './validate-quantity-unit-rules';

describe('validateQuantityUnitRules', () => {
  it('accepts fractional rules within the configured precision', () => {
    expect(() => validateQuantityUnitRules({
      quantityPrecision: 3,
      allowFraction: true,
      minimumQuantity: '0.001',
      quantityIncrement: '0.005',
    })).not.toThrow();
  });

  it('rejects a quantity increment with excess decimal places', () => {
    expect(() => validateQuantityUnitRules({
      quantityPrecision: 2,
      allowFraction: true,
      quantityIncrement: '0.001',
    })).toThrow(new BadRequestException('Quantity increment cannot exceed 2 decimal places'));
  });

  it('requires zero precision when fractions are disabled', () => {
    expect(() => validateQuantityUnitRules({
      quantityPrecision: 2,
      allowFraction: false,
      quantityIncrement: '1',
    })).toThrow(new BadRequestException('Quantity precision must be 0 when fractions are disabled'));
  });

  it.each(['0', '-1', 'not-a-number'])('rejects invalid positive increment %s', (quantityIncrement) => {
    expect(() => validateQuantityUnitRules({
      quantityPrecision: 4,
      allowFraction: true,
      quantityIncrement,
    })).toThrow(BadRequestException);
  });
});
