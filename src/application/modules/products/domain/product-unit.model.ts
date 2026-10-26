import { AutoMap } from '@automapper/classes';

export class ProductUnit {
  @AutoMap() public id: string;
  @AutoMap() public productId: string;
  @AutoMap() public organizationId: string;
  @AutoMap() public unitId: string;
  @AutoMap() public unitName?: string;
  @AutoMap() public unitSymbol?: string;
  @AutoMap() public isDefault: boolean;
  @AutoMap() public conversionFactor: string;
  @AutoMap() public allowedForSale: boolean;
  @AutoMap() public allowedForPurchase: boolean;
  @AutoMap() public barcode?: string | null;
  @AutoMap() public isActive: boolean;
  @AutoMap(() => Date) public effectiveFrom?: Date;
  @AutoMap(() => Date) public retiredAt?: Date | null;
}
