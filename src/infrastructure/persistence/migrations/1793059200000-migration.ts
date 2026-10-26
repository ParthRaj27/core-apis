import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1793059200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."organization_units" ADD "quantity_precision" smallint NOT NULL DEFAULT 4`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" ADD "allow_fraction" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" ADD "rounding_mode" varchar(16) NOT NULL DEFAULT 'nearest'`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" ADD "minimum_quantity" numeric(24,8)`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" ADD "quantity_increment" numeric(24,8) NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" ADD CONSTRAINT "CHK__organization_units__quantity_precision" CHECK ("quantity_precision" BETWEEN 0 AND 8)`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" ADD CONSTRAINT "CHK__organization_units__rounding_mode" CHECK ("rounding_mode" IN ('nearest', 'up', 'down'))`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" ADD CONSTRAINT "CHK__organization_units__minimum_quantity" CHECK ("minimum_quantity" IS NULL OR "minimum_quantity" > 0)`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" ADD CONSTRAINT "CHK__organization_units__quantity_increment" CHECK ("quantity_increment" > 0)`);

    await queryRunner.query(`ALTER TABLE "core"."products" ADD "base_unit_id" uuid`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD "default_sale_unit_id" uuid`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD "default_purchase_unit_id" uuid`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD CONSTRAINT "FK__products__base_unit" FOREIGN KEY ("base_unit_id") REFERENCES "core"."organization_units"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD CONSTRAINT "FK__products__default_sale_unit" FOREIGN KEY ("default_sale_unit_id") REFERENCES "core"."organization_units"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD CONSTRAINT "FK__products__default_purchase_unit" FOREIGN KEY ("default_purchase_unit_id") REFERENCES "core"."organization_units"("id") ON DELETE RESTRICT`);

    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "organization_id" uuid`);
    await queryRunner.query(`UPDATE "core"."product_units" pu SET "organization_id" = p."organization_id" FROM "core"."products" p WHERE p."id" = pu."product_id"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ALTER COLUMN "organization_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD CONSTRAINT "FK__product_units__organizations" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "conversion_factor" numeric(24,8) NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "allowed_for_sale" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "allowed_for_purchase" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "barcode" varchar(100)`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "is_active" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "effective_from" timestamp NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "retired_at" timestamp`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "created_at" timestamp NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD "updated_at" timestamp`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" ADD CONSTRAINT "CHK__product_units__conversion_factor" CHECK ("conversion_factor" > 0)`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ__product_units__organization_barcode" ON "core"."product_units" ("organization_id", "barcode") WHERE "barcode" IS NOT NULL AND "is_active" = true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "core"."UQ__product_units__organization_barcode"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP CONSTRAINT "CHK__product_units__conversion_factor"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "retired_at"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "effective_from"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "is_active"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "barcode"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "allowed_for_purchase"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "allowed_for_sale"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "conversion_factor"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP CONSTRAINT "FK__product_units__organizations"`);
    await queryRunner.query(`ALTER TABLE "core"."product_units" DROP COLUMN "organization_id"`);

    await queryRunner.query(`ALTER TABLE "core"."products" DROP CONSTRAINT "FK__products__default_purchase_unit"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP CONSTRAINT "FK__products__default_sale_unit"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP CONSTRAINT "FK__products__base_unit"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "default_purchase_unit_id"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "default_sale_unit_id"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "base_unit_id"`);

    await queryRunner.query(`ALTER TABLE "core"."organization_units" DROP CONSTRAINT "CHK__organization_units__quantity_increment"`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" DROP CONSTRAINT "CHK__organization_units__minimum_quantity"`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" DROP CONSTRAINT "CHK__organization_units__rounding_mode"`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" DROP CONSTRAINT "CHK__organization_units__quantity_precision"`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" DROP COLUMN "quantity_increment"`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" DROP COLUMN "minimum_quantity"`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" DROP COLUMN "rounding_mode"`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" DROP COLUMN "allow_fraction"`);
    await queryRunner.query(`ALTER TABLE "core"."organization_units" DROP COLUMN "quantity_precision"`);
  }
}
