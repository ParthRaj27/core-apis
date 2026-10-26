import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { BaseRepo } from '../../../common';
import { Filter } from '../../../common';
import { InventoryEntity, OrganizationUnitEntity, ProductEntity, ProductUnitEntity } from '../entities';
import { OrganizationUnit, OrganizationUnitFilter } from '../../../application/modules/organization-units/domain';
import { IOrganizationUnitRepo } from 'src/application/modules/organization-units';

@Injectable()
export class OrganizationUnitRepo
  extends BaseRepo<OrganizationUnitEntity, OrganizationUnit, string, Filter<OrganizationUnitFilter>, Filter<OrganizationUnitFilter>>
  implements IOrganizationUnitRepo {
  constructor(
    @InjectRepository(OrganizationUnitEntity) internalRepo: Repository<OrganizationUnitEntity>,
    @InjectMapper() mapper: Mapper,
    @InjectPinoLogger(OrganizationUnitRepo.name) logger: PinoLogger,
  ) {
    super(internalRepo, mapper, logger, OrganizationUnitEntity, OrganizationUnit);
  }

  public override get idColumnName(): keyof OrganizationUnitEntity {
    return 'id';
  }

  public async isInUseAsync(id: string): Promise<boolean> {
    const manager = this.internalRepo.manager;
    const [productUnit, inventory, product] = await Promise.all([
      manager.exists(ProductUnitEntity, { where: { unitId: id } }),
      manager.exists(InventoryEntity, { where: { unitId: id } }),
      manager.exists(ProductEntity, { where: [
        { baseUnitId: id },
        { defaultSaleUnitId: id },
        { defaultPurchaseUnitId: id },
      ] }),
    ]);
    return productUnit || inventory || product;
  }
}
