import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ProductUnitConfigurationRequest {
  @ApiProperty()
  @IsUUID()
  public unitId: string;

  @ApiProperty({ type: String, example: '10', description: 'Base quantity represented by one selected unit' })
  @IsNumberString()
  public conversionFactor: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  public allowedForSale?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  public allowedForPurchase?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public barcode?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}
