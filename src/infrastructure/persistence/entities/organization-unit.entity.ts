import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { CORE_SCHEMA, ECoreTableName } from './e-core-table-name';
import { OrganizationEntity } from './organization.entity';
import { EQuantityRoundingMode } from '../../../application/modules/organization-units/domain';

const PK_NAME = 'PK_' + ECoreTableName.OrganizationUnits;

@Unique(`UQ__${ECoreTableName.OrganizationUnits}__org_symbol`, ['organizationId', 'symbol'])
@Entity({ schema: CORE_SCHEMA, name: ECoreTableName.OrganizationUnits })
export class OrganizationUnitEntity {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: PK_NAME })
  public id: string;

  @AutoMap()
  @Column({ name: 'organization_id', type: 'uuid' })
  public organizationId: string;

  @AutoMap()
  @Column({ name: 'name', type: 'varchar', length: 100 })
  public name: string;

  @AutoMap()
  @Column({ name: 'symbol', type: 'varchar', length: 20 })
  public symbol: string;

  @AutoMap()
  @Column({ name: 'quantity_precision', type: 'smallint', default: 4 })
  public quantityPrecision: number;

  @AutoMap()
  @Column({ name: 'allow_fraction', type: 'boolean', default: true })
  public allowFraction: boolean;

  @AutoMap()
  @Column({ name: 'rounding_mode', type: 'varchar', length: 16, default: EQuantityRoundingMode.Nearest })
  public roundingMode: EQuantityRoundingMode;

  @AutoMap()
  @Column({ name: 'minimum_quantity', type: 'decimal', precision: 24, scale: 8, nullable: true })
  public minimumQuantity?: string | null;

  @AutoMap()
  @Column({ name: 'quantity_increment', type: 'decimal', precision: 24, scale: 8, default: 1 })
  public quantityIncrement: string;

  @AutoMap()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive: boolean;

  @AutoMap()
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  public sortOrder: number;

  @AutoMap(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @AutoMap(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  public updatedAt?: Date;

  @AutoMap(() => OrganizationEntity)
  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({
    name: 'organization_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: `FK__${ECoreTableName.OrganizationUnits}__${ECoreTableName.Organizations}`,
  })
  public organization: OrganizationEntity;
}
