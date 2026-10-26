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
import { ProductEntity } from './product.entity';
import { OrganizationUnitEntity } from './organization-unit.entity';

const PK_NAME = 'PK_' + ECoreTableName.ProductUnits;

@Unique(`UQ__${ECoreTableName.ProductUnits}__product_unit`, ['productId', 'unitId'])
@Entity({ schema: CORE_SCHEMA, name: ECoreTableName.ProductUnits })
export class ProductUnitEntity {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: PK_NAME })
  public id: string;

  @AutoMap()
  @Column({ name: 'product_id', type: 'uuid' })
  public productId: string;

  @AutoMap()
  @Column({ name: 'organization_id', type: 'uuid' })
  public organizationId: string;

  @AutoMap()
  @Column({ name: 'unit_id', type: 'uuid' })
  public unitId: string;

  @AutoMap()
  @Column({ name: 'is_default', type: 'boolean', default: false })
  public isDefault: boolean;

  @AutoMap()
  @Column({ name: 'conversion_factor', type: 'decimal', precision: 24, scale: 8, default: 1 })
  public conversionFactor: string;

  @AutoMap()
  @Column({ name: 'allowed_for_sale', type: 'boolean', default: true })
  public allowedForSale: boolean;

  @AutoMap()
  @Column({ name: 'allowed_for_purchase', type: 'boolean', default: true })
  public allowedForPurchase: boolean;

  @AutoMap()
  @Column({ name: 'barcode', type: 'varchar', length: 100, nullable: true })
  public barcode?: string | null;

  @AutoMap()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive: boolean;

  @AutoMap(() => Date)
  @Column({ name: 'effective_from', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public effectiveFrom: Date;

  @AutoMap(() => Date)
  @Column({ name: 'retired_at', type: 'timestamp', nullable: true })
  public retiredAt?: Date | null;

  @AutoMap(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @AutoMap(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  public updatedAt?: Date;

  @AutoMap(() => ProductEntity)
  @ManyToOne(() => ProductEntity, (p) => p.productUnits, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'product_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: `FK__${ECoreTableName.ProductUnits}__${ECoreTableName.Products}`,
  })
  public product: ProductEntity;

  @AutoMap(() => OrganizationUnitEntity)
  @ManyToOne(() => OrganizationUnitEntity, { eager: false })
  @JoinColumn({
    name: 'unit_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: `FK__${ECoreTableName.ProductUnits}__${ECoreTableName.OrganizationUnits}`,
  })
  public unit: OrganizationUnitEntity;
}
