import { AutoMap } from '@automapper/classes';
import { EQuantityRoundingMode } from './e-quantity-rounding-mode.enum';

export class OrganizationUnit {
  @AutoMap() public id: string;
  @AutoMap() public organizationId?: string;
  @AutoMap() public name?: string;
  @AutoMap() public symbol?: string;
  @AutoMap() public quantityPrecision?: number;
  @AutoMap() public allowFraction?: boolean;
  @AutoMap() public roundingMode?: EQuantityRoundingMode;
  @AutoMap() public minimumQuantity?: string | null;
  @AutoMap() public quantityIncrement?: string;
  @AutoMap() public isActive?: boolean;
  @AutoMap() public sortOrder?: number;
  @AutoMap(() => Date) public createdAt?: Date;
  @AutoMap(() => Date) public updatedAt?: Date;
}
