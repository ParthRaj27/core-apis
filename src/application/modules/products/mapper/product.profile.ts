import { createMap, forMember, mapFrom, mapWith, Mapper } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { ProductEntity, ProductImageEntity, ProductSupplierEntity, ProductUnitEntity, TaxEntity } from '../../../../infrastructure';
import { Product, ProductImage, ProductSupplier, ProductUnit } from '../domain';
import { CreateProductRequest, UpdateProductRequest, UpdateProductPriceRequest, ProductResponse, ProductImageResponse, ListProductsRequest, SearchProductsRequest, ProductUnitResponse } from '../models';
import { AddProductImageCommand, CreateProductCommand, UpdateProductCommand, UpdateProductPriceCommand, LinkProductSupplierCommand, UpdateProductSupplierCommand } from '../commands';
import { ListProductsQuery, SearchProductsQuery } from '../queries';
import { ProductSupplierResponse, LinkProductSupplierRequest, UpdateProductSupplierRequest } from '../models';
import { Tax } from '../../taxes/domain';
import { TaxResponse } from '../../taxes/models';

@Injectable()
export class ProductProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) { super(mapper); }

  public get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        ProductUnitEntity,
        ProductUnit,
        forMember(
          (dest) => dest.unitName,
          mapFrom((src) => src.unit?.name ?? undefined),
        ),
        forMember(
          (dest) => dest.unitSymbol,
          mapFrom((src) => src.unit?.symbol ?? undefined),
        ),
      );
      createMap(
        mapper,
        ProductEntity,
        Product,
        forMember(
          (dest) => dest.tax,
          mapWith(Tax, TaxEntity, (src) => src.tax),
        ),
        forMember(
          (dest) => dest.productUnits,
          mapFrom((src) =>
            src.productUnits?.map((pu): ProductUnit => ({
              id: pu.id,
              productId: pu.productId,
              organizationId: pu.organizationId,
              unitId: pu.unitId,
              unitName: pu.unit?.name,
              unitSymbol: pu.unit?.symbol,
              isDefault: pu.isDefault,
              conversionFactor: pu.conversionFactor,
              allowedForSale: pu.allowedForSale,
              allowedForPurchase: pu.allowedForPurchase,
              barcode: pu.barcode,
              isActive: pu.isActive,
            })) ?? [],
          ),
        ),
      );
      createMap(mapper, Product, ProductEntity);
      createMap(mapper, ProductImageEntity, ProductImage);
      createMap(mapper, ProductImage, ProductImageEntity);
      createMap(mapper, ProductSupplierEntity, ProductSupplier);
      createMap(mapper, ProductSupplier, ProductSupplierEntity);
      createMap(mapper, AddProductImageCommand, ProductImage);
      createMap(mapper, ProductImage, ProductImageResponse);
      createMap(mapper, ListProductsRequest, ListProductsQuery);
      createMap(mapper, SearchProductsRequest, SearchProductsQuery);
      createMap(mapper, CreateProductRequest, CreateProductCommand);
      createMap(mapper, CreateProductCommand, Product);
      createMap(mapper, UpdateProductRequest, UpdateProductCommand);
      createMap(mapper, UpdateProductCommand, Product);
      createMap(mapper, UpdateProductPriceRequest, UpdateProductPriceCommand);
      createMap(mapper, UpdateProductPriceCommand, Product);
      createMap(mapper, TaxEntity, Tax);
      createMap(mapper, Tax, TaxResponse);
      createMap(
        mapper,
        Product,
        ProductResponse,
        forMember(
          (dest) => dest.tax,
          mapWith(TaxResponse, Tax, (src) => src.tax),
        ),
        forMember(
          (dest) => dest.units,
          mapFrom((src) =>
            src.productUnits?.map((pu): ProductUnitResponse => ({
              id: pu.id,
              unitId: pu.unitId,
              unitName: pu.unitName,
              unitSymbol: pu.unitSymbol,
              isDefault: pu.isDefault,
              conversionFactor: pu.conversionFactor,
              allowedForSale: pu.allowedForSale,
              allowedForPurchase: pu.allowedForPurchase,
              barcode: pu.barcode,
              isActive: pu.isActive,
            })) ?? [],
          ),
        ),
      );
      createMap(mapper, LinkProductSupplierRequest, LinkProductSupplierCommand);
      createMap(mapper, LinkProductSupplierCommand, ProductSupplier);
      createMap(mapper, UpdateProductSupplierRequest, UpdateProductSupplierCommand);
      createMap(mapper, UpdateProductSupplierCommand, ProductSupplier);
      createMap(mapper, ProductSupplier, ProductSupplierResponse);
    };
  }
}
