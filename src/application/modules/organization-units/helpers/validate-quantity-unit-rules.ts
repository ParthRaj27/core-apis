import { BadRequestException } from '@nestjs/common';
import { OrganizationUnit } from '../domain';

const DECIMAL_PATTERN = /^\d+(?:\.(\d+))?$/;

export function validateQuantityUnitRules(unit: Pick<OrganizationUnit, 'quantityPrecision' | 'allowFraction' | 'minimumQuantity' | 'quantityIncrement'>): void {
  const precision = unit.quantityPrecision ?? 4;
  if (!Number.isInteger(precision) || precision < 0 || precision > 8) {
    throw new BadRequestException('Quantity precision must be an integer between 0 and 8');
  }

  validatePositiveDecimal('Minimum quantity', unit.minimumQuantity, precision, true);
  validatePositiveDecimal('Quantity increment', unit.quantityIncrement ?? '1', precision, false);

  if (unit.allowFraction === false && precision !== 0) {
    throw new BadRequestException('Quantity precision must be 0 when fractions are disabled');
  }
  if (unit.allowFraction === false && !isWholeDecimal(unit.quantityIncrement ?? '1')) {
    throw new BadRequestException('Quantity increment must be a whole number when fractions are disabled');
  }
}

function validatePositiveDecimal(label: string, value: string | null | undefined, precision: number, nullable: boolean): void {
  if (value == null || value === '') {
    if (nullable) return;
    throw new BadRequestException(`${label} is required`);
  }
  const match = DECIMAL_PATTERN.exec(value);
  if (!match || !/[1-9]/.test(value)) {
    throw new BadRequestException(`${label} must be greater than zero`);
  }
  if ((match[1]?.length ?? 0) > precision) {
    throw new BadRequestException(`${label} cannot exceed ${precision} decimal places`);
  }
}

function isWholeDecimal(value: string): boolean {
  const [, fraction = ''] = value.split('.');
  return fraction.replace(/0/g, '').length === 0;
}
