import { AutoMap } from '@automapper/classes';
import { CommandBase } from 'src/common';
import { ProductUnitConfigurationRequest } from '../../models';

export class UpdateProductCommand extends CommandBase {
  @AutoMap()
  public id: string;

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
  public isActive?: boolean;

  @AutoMap()
  public manufacturer?: string;

  @AutoMap()
  public packSize?: number;

  @AutoMap()
  public weightKg?: number;

  @AutoMap()
  public taxId?: string | null;

  public unitIds?: string[];
  public defaultUnitId?: string;
  public units?: ProductUnitConfigurationRequest[];
  @AutoMap() public baseUnitId?: string;
  @AutoMap() public defaultSaleUnitId?: string;
  @AutoMap() public defaultPurchaseUnitId?: string;
}
