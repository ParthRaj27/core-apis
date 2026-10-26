import { AutoMap } from '@automapper/classes';
import { CommandBase } from 'src/common';
import { ProductUnitConfigurationRequest } from '../../models';

export class CreateProductCommand extends CommandBase {
  @AutoMap()
  public name?: string;

  @AutoMap()
  public categoryId?: string;

  @AutoMap()
  public sku?: string;

  @AutoMap()
  public barcode?: string;

  @AutoMap()
  public description?: string;

  @AutoMap()
  public costPrice?: number;

  @AutoMap()
  public retailPrice?: number;

  @AutoMap()
  public loyaltyPrice?: number;

  @AutoMap()
  public wholesalePrice?: number;

  @AutoMap()
  public transferPrice?: number;

  @AutoMap()
  public reorderPoint?: number;

  @AutoMap()
  public manufacturer?: string;

  @AutoMap()
  public packSize?: number;

  @AutoMap()
  public weightKg?: number;

  @AutoMap()
  public taxId?: string | null;

  @AutoMap()
  public organizationId?: string;

  @AutoMap()
  public createdById?: string;

  public unitIds?: string[];
  public defaultUnitId?: string;
  public units?: ProductUnitConfigurationRequest[];
  @AutoMap() public baseUnitId?: string;
  @AutoMap() public defaultSaleUnitId?: string;
  @AutoMap() public defaultPurchaseUnitId?: string;
}
