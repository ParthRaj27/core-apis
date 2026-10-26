import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductUnitResponse {
  @ApiProperty() public id: string;
  @ApiProperty() public unitId: string;
  @ApiPropertyOptional() public unitName?: string;
  @ApiPropertyOptional() public unitSymbol?: string;
  @ApiProperty() public isDefault: boolean;
  @ApiProperty({ type: String, example: '10.00000000' }) public conversionFactor: string;
  @ApiProperty() public allowedForSale: boolean;
  @ApiProperty() public allowedForPurchase: boolean;
  @ApiPropertyOptional() public barcode?: string;
  @ApiProperty() public isActive: boolean;
}
