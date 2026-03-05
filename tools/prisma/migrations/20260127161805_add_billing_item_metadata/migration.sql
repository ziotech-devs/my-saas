-- CreateTable
CREATE TABLE "BillingItemMetadata" (
    "id" TEXT NOT NULL,
    "billingItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "yearlyPrice" DOUBLE PRECISION NOT NULL,
    "badge" JSONB,
    "features" JSONB NOT NULL DEFAULT '[]',
    "buttonText" TEXT NOT NULL DEFAULT 'Subscribe',
    "buttonVariant" TEXT NOT NULL DEFAULT 'secondary',
    "buttonIcon" BOOLEAN NOT NULL DEFAULT false,
    "isContactSales" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingItemMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingItemMetadata_billingItemId_key" ON "BillingItemMetadata"("billingItemId");

-- AddForeignKey
ALTER TABLE "BillingItemMetadata" ADD CONSTRAINT "BillingItemMetadata_billingItemId_fkey" FOREIGN KEY ("billingItemId") REFERENCES "BillingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
