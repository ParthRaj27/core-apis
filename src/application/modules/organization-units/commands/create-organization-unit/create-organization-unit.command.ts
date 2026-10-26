import { AutoMap } from '@automapper/classes';
import { CommandBase } from 'src/common';
import { EQuantityRoundingMode } from '../../domain';

export class CreateOrganizationUnitCommand extends CommandBase {
  @AutoMap() public organizationId: string;
  @AutoMap() public name: string;
  @AutoMap() public symbol: string;
  @AutoMap() public quantityPrecision?: number;
  @AutoMap() public allowFraction?: boolean;
  @AutoMap() public roundingMode?: EQuantityRoundingMode;
  @AutoMap() public minimumQuantity?: string | null;
  @AutoMap() public quantityIncrement?: string;
  @AutoMap() public isActive?: boolean;
  @AutoMap() public sortOrder?: number;
}
