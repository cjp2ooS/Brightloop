-- Prices are stored as integer minor units throughout the catalog API.
ALTER TABLE "Product"
  ALTER COLUMN "costPrice" DROP DEFAULT;

ALTER TABLE "Product"
  ALTER COLUMN "type" SET DEFAULT 'SOFTWARE',
  ALTER COLUMN "salesPrice" TYPE INTEGER USING ROUND("salesPrice" * 100)::INTEGER,
  ALTER COLUMN "costPrice" TYPE INTEGER USING ROUND("costPrice" * 100)::INTEGER;

ALTER TABLE "Product"
  ALTER COLUMN "costPrice" SET DEFAULT 0;

ALTER TABLE "ProductVariant"
  ALTER COLUMN "extraPrice" DROP DEFAULT;

ALTER TABLE "ProductVariant"
  ALTER COLUMN "extraPrice" TYPE INTEGER USING ROUND("extraPrice" * 100)::INTEGER,
  ALTER COLUMN "extraPrice" SET DEFAULT 0;

CREATE UNIQUE INDEX "ProductVariant_productId_attribute_value_key"
  ON "ProductVariant"("productId", "attribute", "value");

CREATE TABLE "ProductTax" (
  "productId" TEXT NOT NULL,
  "taxId" TEXT NOT NULL,
  CONSTRAINT "ProductTax_pkey" PRIMARY KEY ("productId", "taxId")
);

CREATE INDEX "ProductTax_taxId_idx" ON "ProductTax"("taxId");

ALTER TABLE "ProductTax"
  ADD CONSTRAINT "ProductTax_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ProductTax_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
