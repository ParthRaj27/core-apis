import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EQuantityRoundingMode } from '../../domain';

export class OrganizationUnitResponse {
  @ApiProperty() @AutoMap() public id: string;
  @ApiPropertyOptional() @AutoMap() public organizationId?: string;
  @ApiPropertyOptional() @AutoMap() public name?: string;
  @ApiPropertyOptional() @AutoMap() public symbol?: string;
  @ApiPropertyOptional() @AutoMap() public quantityPrecision?: number;
  @ApiPropertyOptional() @AutoMap() public allowFraction?: boolean;
  @ApiPropertyOptional({ enum: EQuantityRoundingMode }) @AutoMap() public roundingMode?: EQuantityRoundingMode;
  @ApiPropertyOptional({ type: String, nullable: true }) @AutoMap() public minimumQuantity?: string | null;
  @ApiPropertyOptional({ type: String }) @AutoMap() public quantityIncrement?: string;
  @ApiPropertyOptional() @AutoMap() public isActive?: boolean;
  @ApiPropertyOptional() @AutoMap() public sortOrder?: number;
  @ApiPropertyOptional() @AutoMap(() => Date) public createdAt?: Date;
  @ApiPropertyOptional() @AutoMap(() => Date) public updatedAt?: Date;
}
