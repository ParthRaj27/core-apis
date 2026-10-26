import { AutoMap } from '@automapper/classes';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductUnitEntity } from './product-unit.entity';
import { CORE_SCHEMA, ECoreTableName } from './e-core-table-name';
import { OrganizationEntity } from './organization.entity';
import { CategoryEntity } from './category.entity';
import { TaxEntity } from './tax.entity';
import { InventoryEntity } from './inventory.entity';
import { PurchaseItemEntity } from './purchase-item.entity';
import { UserEntity } from './user.entity';
import { ProductImageEntity } from './product-image.entity';
import { ProductSupplierEntity } from './product-supplier.entity';

const PK_NAME = 'PK_' + ECoreTableName.Products;


@Entity({ schema: CORE_SCHEMA, name: ECoreTableName.Products })
export class ProductEntity {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: PK_NAME })
  public id: string;

  @AutoMap()
  @Column({ type: 'uuid' })
  public organizationId: string;

  @AutoMap()
  @Column({ type: 'uuid', nullable: true })
  public categoryId?: string;

  @AutoMap()
  @Column({ type: 'uuid', nullable: true })
  public createdById?: string;

  @AutoMap()
  @Column({ type: 'varchar', length: 255 })
  public name: string;

  @AutoMap()
  @Column({ type: 'varchar', length: 100, nullable: true, unique: false })
  public sku?: string;

  @AutoMap()
  @Column({ type: 'varchar', length: 100, nullable: true })
  public barcode?: string;

  @AutoMap()
  @Column({ type: 'text', nullable: true })
  public description?: string;


  /** Acquisition / landed cost */
  @AutoMap()
  @Column({ name: 'cost_price', type: 'decimal', precision: 18, scale: 4, default: 0 })
  public costPrice: number;

  /** Tier 1 — Walk-in / retail customers */
  @AutoMap()
  @Column({ name: 'retail_price', type: 'decimal', precision: 18, scale: 4, default: 0 })
  public retailPrice: number;

  /** Tier 2 — Regular / loyal customers */
  @AutoMap()
  @Column({ name: 'loyalty_price', type: 'decimal', precision: 18, scale: 4, default: 0 })
  public loyaltyPrice: number;

  /** Tier 3 — Wholesale / other shops */
  @AutoMap()
  @Column({ name: 'wholesale_price', type: 'decimal', precision: 18, scale: 4, default: 0 })
  public wholesalePrice: number;

  /** Tier 4 — Cost-to-cost transfer price for other branches */
  @AutoMap()
  @Column({ name: 'transfer_price', type: 'decimal', precision: 18, scale: 4, default: 0 })
  public transferPrice: number;

  /** Reorder point — triggers low-stock alert */
  @AutoMap()
  @Column({ type: 'integer', default: 0 })
  public reorderPoint: number;

  /** Brand / manufacturer name */
  @AutoMap()
  @Column({ type: 'varchar', length: 255, nullable: true })
  public manufacturer?: string;

  /** Units per pack — conversion factor between pack UoM and base unit */
  @AutoMap()
  @Column({ name: 'pack_size', type: 'integer', nullable: true })
  public packSize?: number;

  @AutoMap()
  @Column({ name: 'base_unit_id', type: 'uuid', nullable: true })
  public baseUnitId?: string;

  @AutoMap()
  @Column({ name: 'default_sale_unit_id', type: 'uuid', nullable: true })
  public defaultSaleUnitId?: string;

  @AutoMap()
  @Column({ name: 'default_purchase_unit_id', type: 'uuid', nullable: true })
  public defaultPurchaseUnitId?: string;

  /** Gross weight per base unit in kg (with packaging) — used for freight and delivery load calculation */
  @AutoMap()
  @Column({ name: 'weight_kg', type: 'decimal', precision: 10, scale: 4, nullable: true })
  public weightKg?: number;

  @AutoMap()
  @Column({ name: 'tax_id', type: 'uuid', nullable: true })
  public taxId?: string | null;

  @AutoMap()
  @Column({ type: 'boolean', default: true })
  public isActive: boolean;

  @AutoMap(() => Date)
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @AutoMap(() => Date)
  @UpdateDateColumn({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  public updatedAt?: Date;

  @AutoMap(() => Date)
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  public deletedAt?: Date;

  // ─── Relations ──────────────────────────────────────────────────────────────

  @AutoMap(() => OrganizationEntity)
  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({
    name: 'organization_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: `FK__${ECoreTableName.Products}__${ECoreTableName.Organizations}`,
  })
  public organization: OrganizationEntity;

  @AutoMap(() => CategoryEntity)
  @ManyToOne(() => CategoryEntity, (cat) => cat.products, { nullable: true })
  @JoinColumn({
    name: 'category_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: `FK__${ECoreTableName.Products}__${ECoreTableName.Categories}`,
  })
  public category?: CategoryEntity;

  @AutoMap(() => TaxEntity)
  @ManyToOne(() => TaxEntity, { nullable: true, eager: false })
  @JoinColumn({
    name: 'tax_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: `FK__${ECoreTableName.Products}__${ECoreTableName.Taxes}`,
  })
  public tax?: TaxEntity;

  @AutoMap(() => UserEntity)
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({
    name: 'created_by_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: `FK__${ECoreTableName.Products}__${ECoreTableName.Users}`,
  })
  public createdBy?: UserEntity;

  @AutoMap(() => [ProductImageEntity])
  @OneToMany(() => ProductImageEntity, (img) => img.product)
  public images?: ProductImageEntity[];

  @AutoMap(() => [ProductSupplierEntity])
  @OneToMany(() => ProductSupplierEntity, (ps) => ps.product)
  public productSuppliers?: ProductSupplierEntity[];

  @AutoMap(() => [InventoryEntity])
  @OneToMany(() => InventoryEntity, (inv) => inv.product)
  public inventory?: InventoryEntity[];

  @AutoMap(() => [PurchaseItemEntity])
  @OneToMany(() => PurchaseItemEntity, (pi) => pi.product)
  public purchaseItems?: PurchaseItemEntity[];

  @AutoMap(() => [ProductUnitEntity])
  @OneToMany(() => ProductUnitEntity, (pu) => pu.product)
  public productUnits?: ProductUnitEntity[];
}
