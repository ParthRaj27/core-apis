import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { EQuantityRoundingMode } from '../../domain';

export class CreateOrganizationUnitRequest {
  @ApiProperty() @IsNotEmpty() @IsString() @AutoMap() public name: string;
  @ApiProperty() @IsNotEmpty() @IsString() @AutoMap() public symbol: string;
  @ApiPropertyOptional({ default: 4, minimum: 0, maximum: 8 }) @IsOptional() @IsInt() @Min(0) @Max(8) @AutoMap() public quantityPrecision?: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() @AutoMap() public allowFraction?: boolean;
  @ApiPropertyOptional({ enum: EQuantityRoundingMode, default: EQuantityRoundingMode.Nearest }) @IsOptional() @IsEnum(EQuantityRoundingMode) @AutoMap() public roundingMode?: EQuantityRoundingMode;
  @ApiPropertyOptional({ type: String, example: '0.001', nullable: true }) @IsOptional() @ValidateIf((_object, value) => value !== null) @IsNumberString() @AutoMap() public minimumQuantity?: string | null;
  @ApiPropertyOptional({ type: String, example: '0.001', default: '1' }) @IsOptional() @IsNumberString() @AutoMap() public quantityIncrement?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() @AutoMap() public isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @AutoMap() public sortOrder?: number;
}
