# Multi-Unit Product and Inventory Design

Date: 2026-10-26  
Status: Approved design; implementation not started

## Document governance

This is the canonical, living context document for the multi-UOM inventory feature. Any future change to its requirements, architecture, database model, API contracts, role scope, migration, rollout, or test expectations must update this file in the same change. Supporting implementation notes may link here, but must not become a conflicting source of truth.

## Implementation status

Current branch: `core-apis/feature/multi-uom-inventory` (based on `develop`). Changes remain uncommitted until explicitly requested.

Phase 1 is implemented locally and verified:

- organization units now carry quantity precision, fraction, rounding, minimum, and increment policies;
- database checks and additive product/product-unit foundation columns are defined in migration `1793059200000`;
- create/update validation rejects invalid or inconsistent quantity rules;
- create, update, and delete/retire operations are restricted to Org Admin and Super Admin; Branch Manager retains read access;
- referenced units are retired instead of hard-deleted;
- ERP Client organization-unit create/edit/list UI exposes the new policies;
- Core API build, focused validation tests, ERP renderer build, and Electron main-process build pass.

Phase 2 is implemented locally and verified at the configuration layer:

- products have explicit base, default sale, and default purchase unit fields;
- product-unit records carry organization ownership, conversion factor, operation permissions, barcode, active/effective/retired state, and audit timestamps;
- structured unit configuration is tenant-validated and legacy `unitIds/defaultUnitId` writes remain temporarily compatible;
- base conversion must be `1`, defaults must be active and operation-enabled, factors must be positive with at most eight decimals, and product-unit barcodes are unique per organization;
- base units cannot change after inventory or transaction history exists;
- removed conversions retire instead of being deleted;
- ERP Client runs on `feature/multi-uom-inventory` from `main` and provides a dedicated product conversion editor plus conversion detail display;
- the Products three-dot menu provides an `Inventory & units` modal: users with product access can inspect location balances and conversion rules, while only Org Admin/Super Admin can save conversion changes;
- Core API build, 16 focused tests, and ERP renderer production build pass.

Phase 3 canonical quantity conversion and mixed-component services are not yet implemented. Inventory and transaction workflows still use their legacy quantity/`packSize` behavior and must not be considered converted by the Phase 1–2 configuration work.

## Purpose

Add production-grade, organization-configurable units of measure (UOM) so one product can be purchased, stocked, sold, transferred, returned, and adjusted through different units without corrupting inventory or financial history.

Representative requirement:

```text
Product: Rice
Base inventory unit: KG
1 Bag = 10 KG

Receive 1 Bag → stock becomes 10 KG
Sell 3 KG     → stock becomes 7 KG
```

The authoritative balance is always stored in the product's base unit. A package such as Bag is a transaction and display unit, not a separate stock pool.

## Confirmed product decisions

1. Every product has one base inventory unit.
2. All stock balances, reservations, reorder thresholds, valuation, and availability use the base unit.
3. Units are defined in an organization-wide catalogue.
4. Conversion factors are product-specific.
5. An Org Admin can configure any unit name and its behavior; behavior is never inferred from names such as `KG`, `Bag`, `Piece`, or `Carton`.
6. One product can have multiple alternate units, for example 5 KG Bag, 10 KG Bag, and 25 KG Sack.
7. A product may be purchased in one unit and sold in another.
8. Alternate-unit prices are calculated automatically from the base-unit price and conversion factor.
9. Existing retail, loyalty, wholesale, and transfer price tiers convert automatically.
10. Fraction support, precision, minimum quantity, increment, and rounding are organization-configured.
11. Partial package sales are supported by selecting the base or another valid unit. The system does not separately track sealed and opened packages.
12. Historical documents retain the unit and conversion that applied when they were posted.
13. Used conversions are retired and replaced instead of silently rewritten.
14. A base unit cannot be changed after stock/history exists except through a controlled migration.

## Industry grounding

The selected architecture follows the common base/stock-UOM pattern used by established ERP products:

- ERPNext normalizes transaction quantities into a Stock UOM using item-specific conversion factors and supports UOM-specific transaction prices: <https://docs.frappe.io/erpnext/item> and <https://docs.frappe.io/erpnext/item-price>.
- Odoo separates product stock/sales/purchase UOMs from product-specific packaging and converts purchase and sales quantities automatically: <https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/purchase/products/uom.html> and <https://www.odoo.com/documentation/14.0/applications/inventory_and_mrp/inventory/management/products/usage.html>.
- Microsoft Dynamics supports product-specific conversions plus configured precision and rounding: <https://learn.microsoft.com/en-us/dynamics365/supply-chain/pim/tasks/manage-unit-measure>.

## Current implementation assessment

The repository contains partial and competing concepts:

- `products.pack_size` supports only one integer package conversion.
- `product_units` associates products and organization units but has no conversion factor or operational rules.
- `inventory.unit_id` permits separate inventory rows by unit, conflicting with a single base-unit balance.
- Purchase and order items contain `pack_quantity` and `pack_size_snapshot`, but this pattern is not consistently applied to all stock-changing workflows.
- Purchase-item creation can normalize pack quantity through `product.packSize`, while normal order creation accepts quantity and client-supplied pack snapshots without a canonical server conversion.
- Sales, purchases, transfers, reservations, adjustments, damage, write-off, and returns do not share one conversion boundary.
- Existing quantities use decimal columns, but precision and fraction rules are not derived from unit configuration.

Keeping these systems in parallel would create stock, pricing, and reporting drift. The feature must replace them with one canonical model.

## Chosen architecture

### Organization unit catalogue

`organization_units` defines reusable unit identities and quantity behavior within one organization:

| Field | Purpose |
|---|---|
| `id` | Unit UUID |
| `organization_id` | Tenant boundary |
| `name` | User-facing name |
| `symbol` | Short display symbol |
| `quantity_precision` | Maximum decimal places |
| `allow_fraction` | Whether non-whole entered quantities are valid |
| `rounding_mode` | `nearest`, `up`, or `down` |
| `minimum_quantity` | Smallest allowed entered quantity |
| `quantity_increment` | Allowed step, such as `0.001` or `1` |
| `is_active` | Availability for new configuration/transactions |
| audit timestamps | Creation and change history |

Names do not imply behavior. An Org Admin may configure any organization-specific unit.

### Product base unit

Add to `products`:

| Field | Purpose |
|---|---|
| `base_unit_id` | Immutable authoritative inventory unit after use |
| `default_sale_unit_id` | Default selected unit on sales documents |
| `default_purchase_unit_id` | Default selected unit on purchase documents |

All base prices on the product remain prices per base unit.

### Product-specific unit conversion

Evolve `product_units` into the product conversion catalogue:

| Field | Purpose |
|---|---|
| `id` | Conversion identity |
| `product_id` | Owning product |
| `unit_id` | Organization unit |
| `conversion_factor` | Selected quantity multiplied by this value equals base quantity |
| `allowed_for_sale` | Available on quotations, orders, invoices, and sales returns |
| `allowed_for_purchase` | Available on purchase orders, receipts, and supplier returns |
| `barcode` | Optional product-unit barcode |
| `is_active` | Available for new transactions |
| `effective_from` | Start of validity |
| `retired_at` | End of validity |
| audit fields | Actor and timestamps |

Constraints:

- One active conversion per product/unit.
- Conversion factor must be greater than zero.
- The base-unit conversion always has factor `1`.
- Defaults must reference active conversions enabled for their operation.
- Unit, product, and conversion must belong to the same organization.
- Package-specific barcode must be unique within its organization when present.

Use `numeric(24,8)` for conversion factors and quantities, with configured quantity precision limited to `0..8`. Continue using the system's currency-safe decimal type for money (`numeric(18,4)` where that is the existing contract) and apply the organization's currency rounding policy only at the established monetary rounding points. Authoritative calculations must use a decimal arithmetic library or database numeric operations, never binary floating-point arithmetic. Database values and API decimal strings must preserve trailing precision where it has accounting or audit meaning.

## Canonical quantity model

All input passes through a single application service:

```text
QuantityConversionService.convert({
  organizationId,
  productId,
  productUnitId,
  enteredQuantity,
  operation
})
```

It returns:

```text
selectedUnit
enteredQuantity
conversionFactor
baseUnit
baseQuantity
```

It validates tenant ownership, active state, operation permission, fraction rules, precision, minimum quantity, increment, and rounding policy.

No controller, command handler, repository, desktop client, or mobile client may implement independent conversion arithmetic for authoritative state.

## Transaction snapshots

Every persisted transaction line that changes or promises stock records:

| Field | Meaning |
|---|---|
| `product_unit_id` | Selected product conversion identity |
| `selected_unit_id` | Selected organization unit |
| `selected_unit_name_snapshot` | Historical name/symbol for document rendering |
| `entered_quantity` | Quantity entered by the user |
| `conversion_factor_snapshot` | Factor used at posting time |
| `base_quantity` | Normalized stock quantity |
| `price_per_selected_unit` | Displayed/charged unit price |
| `price_per_base_unit` | Base price used to derive the selected price |
| `line_total` | Server-calculated amount |

Existing quantity fields may remain temporarily for compatibility, but their meaning must be explicitly migrated to either entered quantity or base quantity. New code must not use an ambiguous `quantity` field without a documented unit.

## Pricing

Prices are automatic and derived from the product's base-unit price:

```text
pricePerSelectedUnit = pricePerBaseUnit × conversionFactor
lineTotal = enteredQuantity × pricePerSelectedUnit
```

This applies independently to:

- cost price;
- retail price;
- loyalty price;
- wholesale price;
- transfer price.

No per-UOM price override is included in this feature. That is an explicit confirmed decision.

Tax and discount sequencing must reuse the existing document policy after the converted line subtotal is calculated. Server results are authoritative.

## Inventory behavior

Inventory has one row per organization, location, and product. `unit_id` must no longer split the stock pool.

```text
unique(organization_id, location_id, product_id)
```

The stored fields are base-unit quantities:

- quantity on hand;
- quantity reserved;
- quantity available;
- reorder point;
- stock movement quantity/before/after;
- valuation quantities and per-base-unit cost.

Example:

```text
Receive 5 Bags where 1 Bag = 10 KG → +50 KG
Sell 2.5 KG                         → -2.5 KG
Reserve 1 Bag                       → reserve 10 KG
Release that reservation            → release 10 KG
Remaining on hand                   → 47.5 KG
```

Display decomposition such as `4 Bags + 7.5 KG` is informational. It must not create separate ledger balances or imply sealed-package status.

## Workflow coverage

The conversion service and snapshot model are mandatory in:

- quotations;
- sales orders and POS;
- invoices where item quantities are materialized;
- purchase orders;
- goods receipt and partial receipt;
- supplier bills when linked to inventory quantities;
- inventory add/remove/adjust;
- reservations and release;
- stock transfers and transfer requests;
- unpublished stock and publication;
- damage and write-off;
- customer returns and supplier returns;
- picking and packing;
- shipment/trip goods quantities;
- reports, exports, audit logs, and notifications.

Returns use the original line's conversion snapshot. They do not recalculate from current product configuration.

## Concurrency and consistency

Document posting, stock mutation, reservation mutation, movement creation, and financial totals must occur within the same database transaction.

Inventory mutations must lock the relevant inventory row or use an equivalent atomic conditional update. Two concurrent sales must not both consume the same available base quantity. Negative stock remains prohibited unless a separate explicit organization policy is designed later.

## API design principles

Write requests send:

```json
{
  "productId": "uuid",
  "productUnitId": "uuid",
  "quantity": "2.000"
}
```

The API resolves and returns normalized data:

```json
{
  "productId": "uuid",
  "productUnitId": "uuid",
  "enteredQuantity": "2.000",
  "selectedUnit": { "id": "uuid", "name": "Bag", "symbol": "BAG" },
  "conversionFactor": "10.000000",
  "baseQuantity": "20.000000",
  "baseUnit": { "id": "uuid", "name": "Kilogram", "symbol": "KG" },
  "pricePerSelectedUnit": "1000.0000",
  "lineTotal": "2000.0000"
}
```

Decimal quantities and money should cross JSON boundaries as decimal strings where precision must be preserved. Compatibility serializers may temporarily support legacy numeric fields during migration.

Read endpoints should provide active product units, defaults, rules, calculated prices, available base quantity, and optional human-friendly decomposition.

## Authorization

- Super Admin may inspect organization configuration for support but must respect tenant context for mutations.
- Org Admin manages the organization unit catalogue and product conversions.
- Branch Manager may view conversions and use allowed units in branch operations but cannot change organization-wide conversion rules.
- Packer/Warehouse roles use configured units for receipt, pick, pack, transfer, adjustment, and count operations granted by existing permissions.
- Driver sees transaction/display units relevant to assigned trips but does not change conversions.
- Cashier/other sales roles use active selling units and server-calculated prices.

All authorization remains enforced by Core APIs, not only by hidden client controls.

## Org Admin user experience

Product setup contains a dedicated Units section:

1. Select the base inventory unit.
2. Select default sales and purchase units.
3. Add one or more organization units.
4. Enter each factor as a plain-language equation such as `1 Bag = 10 KG`.
5. Choose sale/purchase availability.
6. Optionally assign a package barcode.
7. Preview converted prices before saving.
8. Show a warning when retiring a used conversion.

The form must prevent ambiguous or circular conversions by storing every factor directly against the product's base unit.

## Operational user experience

Sales, purchase, and warehouse lines show:

- quantity input;
- unit selector containing only valid active units for that operation;
- automatic converted price;
- base stock impact before confirmation;
- remaining base stock;
- clear validation messages using both entered and base units.

Example:

```text
Available: 48 KG (approximately 4 Bags + 8 KG)
Quantity: 2
Unit: Bag (10 KG)
Stock required: 20 KG
Price per Bag: 1,000
Remaining: 28 KG
```

Barcode scanning selects both the product and product unit when a product-unit barcode exists.

## Error handling

Reject with explicit domain errors when:

- product unit is missing, inactive, or belongs to another tenant;
- unit is not allowed for the attempted operation;
- quantity is zero or negative;
- fractional quantity is disallowed;
- precision, minimum, or increment rules fail;
- conversion factor is invalid;
- available base stock is insufficient;
- a client total differs from the server calculation;
- a base-unit change is attempted after use;
- migration encounters ambiguous or duplicate unit balances.

Messages should show both units where useful, for example: `2 Bags require 20 KG; only 17.5 KG is available.`

## Migration strategy

Migration is staged and reconciliation-gated:

1. Add the new columns and constraints without removing legacy fields.
2. Create or identify one base unit for every existing product.
3. Convert `packSize` into an alternate product-unit factor where present.
4. Backfill product-unit factor `1` for each base unit.
5. Classify every legacy transaction quantity and backfill unit/conversion/base snapshots.
6. Consolidate inventory rows by organization/location/product into base quantity.
7. Reconcile on-hand, reserved, movement, purchase, sale, transfer, and return totals.
8. Stop migration and emit a report for ambiguous products rather than guessing.
9. Switch writes to the canonical conversion service behind a feature flag.
10. Run parallel read/reconciliation monitoring.
11. Remove or deprecate `packSize`, `packQuantity`, ambiguous quantity semantics, and unit-split inventory only after verification.

Each organization is enabled independently. Rollback disables new UOM writes while preserving additive schema and snapshots; destructive schema cleanup occurs only in a later release.

### Existing inventory-by-unit compatibility plan

The current inventory schema permits separate rows for one organization/location/product when `unit_id` differs. Existing repository paths are also mixed: some include `unit_id`, while other sales, purchase, bill, return, transfer, and stock-operation paths locate stock only by organization/location/product. Consequently, `inventory.unit_id` must not be dropped or silently reinterpreted in the first release.

The migration must use the following gates:

1. **Additive foundation:** add product base units, conversion metadata, and transaction snapshot columns while leaving existing inventory rows and foreign keys intact.
2. **Read-only classification:** classify each existing inventory row as already-base, alternate-unit, legacy-pack, or ambiguous. The classifier must use the product base unit, existing product-unit association, `packSize`, and supporting transaction history. It must never infer semantics from a unit name such as `Bag` or `KG`.
3. **Ambiguity stop:** if a row may already contain a normalized quantity, or its conversion cannot be proven, block that product/organization from activation and emit a reconciliation report. Never multiply uncertain stock automatically.
4. **Deterministic conversion:** for a proven alternate-unit row, convert all unit-bearing quantities to base units:
   - `base_on_hand = quantity_on_hand × conversion_factor`;
   - `base_reserved = quantity_reserved × conversion_factor`;
   - `base_reorder_level = reorder_level × conversion_factor`;
   - `base_max_stock = max_stock × conversion_factor` when present;
   - `base_average_cost = alternate_unit_average_cost ÷ conversion_factor` when the stored cost is proven to be per alternate unit.
5. **Valuation reconciliation:** calculate value per source row before consolidation and require the merged base balance and value to match within the configured currency rounding tolerance. Quantity, reservation, and valuation differences must all be zero or explicitly approved through a separately audited correction workflow.
6. **Canonical-row mapping:** select or create one canonical inventory row per organization/location/product. Repoint stock-movement references safely or retain a durable legacy-to-canonical mapping before retiring duplicate rows; never delete a referenced inventory row.
7. **Shadow verification:** compare legacy totals with canonical base totals while legacy reads remain active. The feature flag can enable canonical writes only after the organization passes reconciliation.
8. **Dual-read transition:** API responses may temporarily expose the legacy `unitId`, but availability, reservation, and valuation calculations must read only the verified canonical base balance after activation. Alternate units are display/input conversions, not stock partitions.
9. **Constraint cutover:** only after all organizations pass verification, replace the legacy four-column uniqueness rule with one canonical row per organization/location/product and stop accepting `unitId` on inventory create/update APIs.
10. **Delayed cleanup:** retain legacy identifiers and audit mappings for the defined retention period. Drop `inventory.unit_id` only in a later release after movement references, reports, exports, and clients no longer depend on it.

Required migration report columns include organization, location, product, inventory row, legacy unit, classification, factor source, original quantities/cost, calculated base quantities/cost, valuation before/after, canonical row, confidence, and blocking reason.

Until cutover, all new code must treat a missing or ambiguous inventory unit as a migration state—not as permission to assume factor `1`.

## Testing requirements

### Unit tests

- factor conversion in both directions for display;
- configured precision, fraction, minimum, increment, and rounding;
- automatic price conversion for every price tier;
- invalid tenant/unit/product combinations;
- snapshot creation and use;
- display decomposition without ledger mutation.

### Integration tests

- buy Bags and sell KG;
- buy KG and sell Bags;
- mixed-unit order lines;
- partial purchase receipts;
- reservation, fulfillment, cancellation, and release;
- branch transfers with send/receive variance;
- damage and write-off in alternate units;
- customer and supplier returns using original snapshots;
- inventory adjustments and counts;
- concurrent deductions preventing negative stock;
- conversion retirement while historical documents remain unchanged;
- package barcode resolution;
- tenant and role isolation.

### Migration tests

- existing product without `packSize`;
- existing product with `packSize`;
- products with several `product_units` rows;
- duplicate inventory rows differentiated by legacy `unit_id`;
- decimal quantities;
- inconsistent or ambiguous legacy data produces a blocking report;
- total base stock, reservation, and valuation before/after match exactly.

### Client tests

- Org Admin unit catalogue and product conversion setup;
- live price and stock-impact preview;
- sales/purchase unit selection;
- warehouse pick/pack display;
- validation and offline retry behavior;
- accessibility, small-screen layout, and keyboard/scanner operation.

## Observability and audit

Record structured events for:

- organization unit created/updated/deactivated;
- product conversion created/retired;
- default unit changed;
- base-unit migration;
- rejected conversion and rounding validation;
- reconciliation mismatch.

Metrics should track conversion errors, migration exceptions, negative-stock prevention, and legacy-path usage until legacy removal.

## Implementation sequence

1. Decimal utility and canonical conversion service with tests.
2. Organization-unit and product-unit schema evolution.
3. Product configuration APIs and Org Admin UI.
4. Inventory normalization and locking rules.
5. Purchase and receipt flows.
6. Sales, quotation, POS, and reservation flows.
7. Transfer, return, damage, adjustment, and unpublished-stock flows.
8. Reports, exports, notifications, mobile warehouse display, and audit events.
9. Legacy-data migration, reconciliation, feature-flag rollout, and cleanup plan.

Each phase must preserve build health and include regression coverage. No phase may introduce a second conversion implementation outside the canonical service.

## Detailed implementation plan: Core API and ERP Client

This plan covers `core-apis` and the Electron desktop application in `ERP-Client`. The API remains authoritative for conversion, validation, stock, prices, and totals. The desktop client may calculate previews for responsiveness, but must always replace them with the server result.

No implementation phase may remove `packSize`, `packQuantity`, `inventory.unit_id`, or existing response fields until the compatibility and reconciliation gates for that phase pass.

### Phase 0 — Baseline, fixtures, and safety harness

#### Core API

1. Capture schema and repository behavior for products, organization units, product units, inventory, stock movements, orders, quotations, bills, purchases, transfers, returns, adjustments, and unpublished stock.
2. Add regression fixtures for:
   - a product with no unit;
   - a product using one unit;
   - a legacy product with `packSize`;
   - a product/location with multiple inventory rows split by `unit_id`;
   - inventory whose quantity may already be normalized;
   - stock movements referencing each legacy inventory row.
3. Add characterization tests around existing pack purchase and sale behavior before changing it.
4. Introduce an organization-scoped feature state with `legacy`, `shadow`, and `canonical` modes. Default all existing organizations to `legacy`.

#### ERP Client

1. Add representative typed fixtures for legacy and canonical API responses.
2. Add regression tests for current POS, purchase receipt, returns, transfer, inventory, quotation, and unpublished-stock calculations.
3. Add one feature-capability hook sourced from the API; do not scatter environment-variable checks through pages.

**Exit gate:** current behavior is covered, both projects build, and enabling no feature flag produces no visible or stock behavior change.

### Phase 1 — Organization unit catalogue

#### Core API

Extend `organization_units` with:

- `quantity_precision` (`0..8`);
- `allow_fraction`;
- `rounding_mode` (`nearest`, `up`, `down`);
- `minimum_quantity`;
- `quantity_increment`;
- active state and existing ordering/audit fields.

Update organization-unit entities, domain models, create/update requests, responses, mapping, validation, and migrations. Validate that minimum and increment are positive and representable within configured precision. Prevent hard deletion when a unit is referenced; retire it instead.

#### ERP Client

Update `renderer/src/types.ts` and `pages/OrganizationUnits/index.tsx` to configure and display precision, fraction policy, increment, minimum, rounding mode, and active state. Explain that these rules govern entered quantity, not product conversion. Replace destructive deletion with retirement messaging when the unit is already used.

**Exit gate:** an Org Admin can define a custom unit such as `Sack`, `Crate`, or `Bundle` without any hardcoded name, and invalid precision/increment combinations are rejected by both client guidance and server validation.

### Phase 2 — Product conversion catalogue

#### Core API

1. Add `base_unit_id`, `default_sale_unit_id`, and `default_purchase_unit_id` to products.
2. Extend `product_units` with conversion factor, sale/purchase permissions, package barcode, active/effective/retired timestamps, and audit information.
3. Replace the association-only `unitIds/defaultUnitId` write contract with a structured `units[]` conversion contract while temporarily accepting the legacy fields.
4. Validate tenant ownership, duplicate units/barcodes, positive factors, enabled defaults, and factor `1` for the base unit.
5. Refuse a base-unit change after the product has inventory or posted transactions; provide a dedicated future migration workflow instead of allowing an ordinary update.
6. Retire removed conversions rather than deleting records used by history.

#### ERP Client

Replace the unit checkbox and `Pack Size` inputs in `ProductOnboardingWizard` with a conversion editor:

- select exactly one base unit;
- add any active organization unit;
- enter `1 selected unit = X base units`;
- enable it for purchase, sale, or both;
- set default purchase and sale units;
- optionally assign a product-unit barcode;
- preview automatic prices for all price tiers.

Example preview: `1 Bag = 10 KG`, base retail price `KSh 120/KG`, derived price `KSh 1,200/Bag`.

Update product detail pages to show the base unit and conversion table. Preserve read compatibility for legacy products until migrated.

**Exit gate:** product configuration supports arbitrary organization units and multiple package sizes without using `packSize` as the authoritative source.

### Phase 3 — Canonical conversion service and API contracts

#### Core API

Implement one injectable `QuantityConversionService` using fixed-precision decimal arithmetic. It must:

- resolve product and product-unit records inside the organization boundary;
- validate operation permission (`sale`, `purchase`, `transfer`, `return`, `adjustment`, `publish`);
- validate fraction, precision, minimum, and increment rules;
- apply the configured rounding policy only when explicitly permitted;
- convert entered quantities into base quantities;
- derive selected-unit prices from base prices;
- return immutable snapshot values for persistence.

Support both a single quantity and mixed-unit components:

```json
{
  "productId": "product-id",
  "components": [
    { "productUnitId": "bag-conversion-id", "quantity": "5" },
    { "productUnitId": "kg-conversion-id", "quantity": "18" }
  ]
}
```

For `1 Bag = 10 KG`, the service returns base quantity `68 KG`. It also returns normalized display components when requested (`6 Bags + 8 KG`) while retaining the original components for audit.

Decimal values cross JSON boundaries as strings. The API rejects client-supplied conversion factors, base quantities, prices, or totals when they differ from server calculations.

#### ERP Client

Create shared client utilities and components:

- `QuantityInput` for one selected unit;
- `MixedQuantityInput` for inputs such as `5 Bags + 18 KG`;
- `UnitSelector` filtered by operation;
- `QuantitySummary` showing entered and base effects;
- formatting helpers for base and decomposed display;
- decimal-string form state that does not use JavaScript floating-point values for authoritative payloads.

Client-side calculations are previews only. Submit selected conversion IDs and decimal quantity strings, then render server-calculated values.

**Exit gate:** conversion unit tests cover zero/negative values, large values, up to eight decimal places, increments, all rounding modes, mixed input, and automatic pricing.

### Phase 4 — Transaction snapshots

#### Core API

Add additive snapshot columns or child component rows to every stock-affecting document line. Each posted line must retain selected conversion identity, selected unit identity/name/symbol, original entered components, factor snapshots, base quantity, base and selected price, and server line total.

Use a child table for mixed components so `5 Bags + 18 KG` remains auditable instead of being flattened into an undocumented text field. The parent line stores the summed base quantity used for stock and finance.

Apply the snapshot contract to quotation, order, bill/invoice, purchase item/receipt, transfer item, sales return, purchase return, inventory adjustment, damage/write-off, and unpublished-stock movement lines.

#### ERP Client

Update shared types and document detail/receipt components to display both original entry and base impact. Historical documents must render snapshots and must not request current conversion factors.

**Exit gate:** changing or retiring a conversion does not alter any historical document quantity, price, total, return allowance, or printed receipt.

### Phase 5 — Inventory compatibility migration and canonical ledger

#### Core API

1. Build a dry-run migration command that produces the inventory compatibility report defined above.
2. Classify each inventory row without mutation and block ambiguous rows.
3. Backfill base units and conversions only where deterministic.
4. Calculate canonical on-hand, reserved, reorder, maximum, average cost, and valuation values.
5. Preserve/repoint stock-movement references through a durable legacy-to-canonical mapping.
6. Add canonical inventory columns/rows and shadow reads without changing legacy writes.
7. Reconcile quantities, reservations, movements, and valuation per organization/location/product.
8. Enable canonical writes organization by organization only after a clean report.
9. Later enforce one inventory row per organization/location/product.

All stock mutations must acquire a database lock on the canonical row and operate in one transaction. Do not convert or aggregate with JavaScript `number` arithmetic.

#### ERP Client

During transition, consume API capability/state fields and avoid merging multiple legacy rows locally. Display a migration-status warning only to authorized admins when an organization/product is blocked. Once canonical mode is enabled, show one balance in the base unit with optional decomposed display.

**Exit gate:** before/after on-hand, reserved quantity, and valuation reconcile exactly for every enabled organization, and concurrent alternate-unit deductions cannot oversell stock.

### Phase 6 — Purchase and receiving flows

#### Core API

Replace `packQuantity × packSize` logic with the canonical conversion service in purchase orders, partial receipts, allocation, unpublished-stock purchases, supplier returns, and publishing. Store snapshots at line creation/posting and use base quantities for inventory and allocation.

Support mixed-unit opening stock and adjustments where authorized. For purchase receipts, each allocation distributes base quantity to locations; the sum must equal the line's received base quantity.

#### ERP Client

Update purchase billing, purchase-order creation/detail/receive, black-stock purchase/receive, and unpublished-stock publish screens. Default to the product's purchase unit, allow another purchase-enabled unit, show the base impact, and support mixed components where the workflow requires them. Replace all `packSize` multiplication in checkout and line totals with server-derived conversion previews/results.

**Exit gate:** receive `5 Bags + 18 KG` for a `10 KG` bag and verify exactly `68 KG` is allocated and valued in inventory.

### Phase 7 — Sales, quotations, reservations, and billing

#### Core API

Use canonical conversion for quotations, orders, reservation, release, fulfillment, dispatch, bills/invoices, POS checkout, and sales returns. Check available base stock, snapshot conversions/prices, and reject client totals that differ from the server.

#### ERP Client

Update quotation builder, orders, POS terminal, checkout helpers, stock badges, bill receipt, and sales returns. Default to the sale unit, permit any sale-enabled conversion, display availability in the chosen unit plus base unit, and compute line totals from the server price. Remove local `qty * packSize` assumptions.

**Exit gate:** purchasing bags and selling partial kilograms produces the correct remaining base balance, reservation behavior, invoice total, and return allowance.

### Phase 8 — Transfers, adjustments, returns, and special stock

#### Core API

Apply the canonical service to stock transfers/requests, inventory create/update/adjustment, customer and supplier returns, damage/write-off, item-return restocking, and unpublished-to-live publishing. Transfers subtract and add the same base quantity; destination display units do not create a new stock pool. Returns use original snapshots.

#### ERP Client

Update stock transfers, inventory detail/adjustment, item returns, purchase returns, sales returns, and unpublished stock. Every mutation shows entered quantity, base impact, and post-operation base balance.

**Exit gate:** every stock-changing route accepts the same quantity contract and no route performs independent conversion arithmetic.

### Phase 9 — Inventory, dashboards, reports, and exports

#### Core API

Return base unit metadata with inventory, low-stock, valuation, analytics, product logs, and stock-movement responses. Provide optional server-generated decomposed display quantities. Aggregate only base quantities and base-unit costs.

#### ERP Client

Update inventory list/detail, inventory dashboard, main dashboard, low-stock cards, valuation, product logs, black-stock reports, and exports. Labels must always include a unit; totals must not add quantities from unrelated products/units. Replace `productPackSize`, `packsOnHand`, and `looseUnits` with generic server-backed display information.

**Exit gate:** all displayed stock has an explicit unit, valuation is unchanged by display-unit selection, and reports agree with the canonical ledger.

### Phase 10 — Cleanup and enforcement

After all organizations are canonical and the compatibility period has passed:

1. Reject legacy `unitIds`, `defaultUnitId`, `packSize`, `packQuantity`, and client snapshot fields on new writes.
2. Remove obsolete client fields and `packSize` calculations.
3. Remove inventory create/update `unitId` inputs.
4. Enforce one inventory row per organization/location/product.
5. Keep historical snapshot columns and legacy mapping/audit data for retention.
6. Remove `inventory.unit_id` only when no movement, report, export, or supported client depends on it.

### Core API file areas

Expected implementation areas include:

- `src/infrastructure/persistence/entities/{organization-unit,product-unit,product,inventory,...}.entity.ts`;
- additive migrations under `src/infrastructure/persistence/migrations/`;
- organization-unit and product request/response/domain/mapper/command files;
- one shared quantity conversion service and decimal helpers;
- inventory, order, bill, quotation, purchase, transfer, return, stock-operation, and unpublished-stock repositories/handlers;
- analytics/report response mapping;
- unit, integration, concurrency, and migration tests.

### ERP Client file areas

Expected implementation areas include:

- `renderer/src/types.ts` and API resource/hooks;
- `pages/OrganizationUnits`;
- `pages/Products/components/ProductOnboardingWizard` and product detail;
- POS terminal, checkout, purchase and sales components;
- Orders, Quotations, Purchase Orders/Receive, Stock Transfers;
- Inventory and Inventory Detail;
- Sales Returns, Purchase Returns, and Item Returns;
- Unpublished/Black Stock flows;
- dashboards, reports, receipts, and exports;
- shared UOM input/formatting components and their tests.

### Delivery and verification policy

- Keep each phase independently buildable and testable.
- Do not commit until explicitly requested by the user.
- Run Core API build/unit/integration/migration tests after each backend phase.
- Run ERP Client type-check/build/Vitest coverage after each client phase.
- Execute the cross-application scenarios in the acceptance matrix before enabling an organization.
- Update this canonical document whenever implementation reveals a changed contract, new risk, migration exception, or scope decision.

## Explicitly out of scope

- Tracking sealed versus opened packages as separate stock states.
- Independent price overrides per alternate UOM.
- Manufacturing/repacking transformations between separate SKUs.
- Variable-weight packages whose actual weight differs per physical package.
- Global cross-organization conversions.
- Allowing clients to calculate or override authoritative base quantities or totals.

These may be designed separately if future business requirements demand them.

## Acceptance criteria

The feature is complete when:

1. An Org Admin can define reusable units and product-specific conversions without hardcoded names.
2. Rice received as Bags and sold partially as KG maintains one correct KG balance.
3. All stock-changing workflows use the same server conversion service.
4. Automatic price conversion is correct for every price tier.
5. Historical documents remain unchanged after a conversion is retired.
6. Inventory cannot be oversold through concurrent alternate-unit transactions.
7. Existing organizations migrate with exact stock/reservation/valuation reconciliation.
8. All roles see and use only the units allowed by their operation and authorization.
9. Desktop and mobile interfaces show entered and base-unit effects clearly.
10. Legacy pack-only behavior is no longer an independent source of truth.
