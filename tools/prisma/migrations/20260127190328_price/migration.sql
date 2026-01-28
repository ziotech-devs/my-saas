-- CreateEnum
CREATE TYPE "SubscriptionInterval" AS ENUM ('monthly', 'yearly');

-- AlterTable
ALTER TABLE "BillingItem" ADD COLUMN     "interval" "SubscriptionInterval" NOT NULL DEFAULT 'monthly';
