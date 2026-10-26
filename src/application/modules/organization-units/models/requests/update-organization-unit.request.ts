import { AutoMap } from '@automapper/classes';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsNumberString, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { EQuantityRoundingMode } from '../../domain';

export class UpdateOrganizationUnitRequest {
  @ApiPropertyOptional() @IsOptional() @IsString() @AutoMap() public name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @AutoMap() public symbol?: string;
  @ApiPropertyOptional({ minimum: 0, maximum: 8 }) @IsOptional() @IsInt() @Min(0) @Max(8) @AutoMap() public quantityPrecision?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() @AutoMap() public allowFraction?: boolean;
  @ApiPropertyOptional({ enum: EQuantityRoundingMode }) @IsOptional() @IsEnum(EQuantityRoundingMode) @AutoMap() public roundingMode?: EQuantityRoundingMode;
  @ApiPropertyOptional({ type: String, nullable: true }) @IsOptional() @ValidateIf((_object, value) => value !== null) @IsNumberString() @AutoMap() public minimumQuantity?: string | null;
  @ApiPropertyOptional({ type: String }) @IsOptional() @IsNumberString() @AutoMap() public quantityIncrement?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() @AutoMap() public isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @AutoMap() public sortOrder?: number;
}
