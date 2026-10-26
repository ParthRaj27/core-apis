import { AutoMap } from '@automapper/classes';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateIf, ValidateNested } from 'class-validator';
import { ProductUnitConfigurationRequest } from './product-unit-configuration.request';

export class CreateProductRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @AutoMap()
  public name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @AutoMap()
  public categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @AutoMap()
  public sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @AutoMap()
  public barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @AutoMap()
  public description?: string;

  @ApiPropertyOptional({ type: [String], description: 'Org unit IDs to associate with this product' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  public unitIds?: string[];

  @ApiPropertyOptional({ description: 'Which unit ID is the default (must be in unitIds)' })
  @IsOptional()
  @IsUUID()
  public defaultUnitId?: string;

  @ApiPropertyOptional({ type: [ProductUnitConfigurationRequest], description: 'Product-specific conversion catalogue' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUnitConfigurationRequest)
  public units?: ProductUnitConfigurationRequest[];

  @ApiPropertyOptional({ description: 'Authoritative inventory unit; its conversion factor must be 1' })
  @IsOptional()
  @IsUUID()
  @AutoMap()
  public baseUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @AutoMap()
  public defaultSaleUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @AutoMap()
  public defaultPurchaseUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @AutoMap()
  public costPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @AutoMap()
  public retailPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @AutoMap()
  public loyaltyPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @AutoMap()
  public wholesalePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @AutoMap()
  public transferPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @AutoMap()
  public reorderPoint?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @AutoMap()
  public manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @AutoMap()
  public packSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @AutoMap()
  public weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  @AutoMap()
  public taxId?: string | null;
}
