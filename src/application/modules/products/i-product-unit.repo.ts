import { IBaseRepo, Filter } from '../../../common';
import { ProductUnit } from './domain';

export interface ProductUnitFilter {
  productId?: string;
  unitId?: string;
}

export interface ProductUnitConfiguration {
  unitId: string;
  conversionFactor: string;
  allowedForSale?: boolean;
  allowedForPurchase?: boolean;
  barcode?: string;
  isActive?: boolean;
}

export const PRODUCT_UNIT_REPO = 'PRODUCT_UNIT_REPO';

export interface IProductUnitRepo extends IBaseRepo<ProductUnit, string, Filter<ProductUnitFilter>, Filter<ProductUnitFilter>> {
  validateConfigurationAsync(
    organizationId: string,
    units: ProductUnitConfiguration[],
    baseUnitId: string,
    defaultSaleUnitId?: string,
    defaultPurchaseUnitId?: string,
    productId?: string,
  ): Promise<void>;
  validateBaseUnitChangeAsync(productId: string, baseUnitId: string): Promise<void>;
  syncForProductAsync(
    productId: string,
    organizationId: string,
    units: ProductUnitConfiguration[],
    baseUnitId: string,
    defaultSaleUnitId?: string,
    defaultPurchaseUnitId?: string,
  ): Promise<void>;
}
