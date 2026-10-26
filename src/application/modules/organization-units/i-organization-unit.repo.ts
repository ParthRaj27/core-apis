import { IBaseRepo, Filter } from '../../../common';
import { OrganizationUnit, OrganizationUnitFilter } from './domain';

export interface IOrganizationUnitRepo extends IBaseRepo<OrganizationUnit, string, Filter<OrganizationUnitFilter>, Filter<OrganizationUnitFilter>> {
  isInUseAsync(id: string): Promise<boolean>;
}

export const ORGANIZATION_UNIT_REPO = 'ORGANIZATION_UNIT_REPO';
