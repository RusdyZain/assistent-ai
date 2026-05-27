-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('product', 'service');

-- CreateEnum
CREATE TYPE "public"."ReplyTemplateType" AS ENUM ('greeting', 'ask_price', 'ask_stock', 'ask_location', 'ask_booking', 'ask_payment', 'order_recap', 'follow_up_warm', 'follow_up_hot', 'payment_reminder', 'complaint_response', 'closing_message');

-- CreateEnum
CREATE TYPE "public"."KnowledgeCategory" AS ENUM ('address', 'payment', 'booking', 'shipping', 'refund', 'reschedule', 'promo', 'faq', 'other');

-- AlterTable
ALTER TABLE "public"."Business" ADD COLUMN     "acceptsCOD" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsQRIS" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsTransfer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowNegotiation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "brandTone" TEXT NOT NULL DEFAULT 'friendly',
ADD COLUMN     "businessCategory" TEXT,
ADD COLUMN     "businessDescription" TEXT,
ADD COLUMN     "businessLocation" TEXT,
ADD COLUMN     "closingPriorityFollowUpHours" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "downPaymentAmount" DECIMAL(12,2),
ADD COLUMN     "downPaymentPercentage" INTEGER,
ADD COLUMN     "hotLeadFollowUpHours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "markLostAfterDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "maxFollowUpCount" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "minimumOrder" DECIMAL(12,2),
ADD COLUMN     "operatingHours" TEXT,
ADD COLUMN     "orderProcess" TEXT,
ADD COLUMN     "paymentInstructions" TEXT,
ADD COLUMN     "refundPolicy" TEXT,
ADD COLUMN     "replyLanguage" TEXT NOT NULL DEFAULT 'Indonesia',
ADD COLUMN     "requiresDownPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reschedulePolicy" TEXT,
ADD COLUMN     "serviceArea" TEXT,
ADD COLUMN     "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "setupStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shippingPolicy" TEXT,
ADD COLUMN     "waitingPaymentFollowUpHours" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "warmLeadFollowUpHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "deliveryInfo" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "faq" JSONB,
ADD COLUMN     "minimumOrder" INTEGER,
ADD COLUMN     "processingTime" TEXT,
ADD COLUMN     "promoPrice" DECIMAL(12,2),
ADD COLUMN     "stockStatus" TEXT,
ADD COLUMN     "suitableFor" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" "public"."ProductType" NOT NULL DEFAULT 'product';

-- CreateTable
CREATE TABLE "public"."ReplyTemplate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "public"."ReplyTemplateType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KnowledgeBaseItem" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "public"."KnowledgeCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReplyTemplate_businessId_isActive_idx" ON "public"."ReplyTemplate"("businessId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ReplyTemplate_businessId_type_key" ON "public"."ReplyTemplate"("businessId", "type");

-- CreateIndex
CREATE INDEX "KnowledgeBaseItem_businessId_category_isActive_idx" ON "public"."KnowledgeBaseItem"("businessId", "category", "isActive");

-- AddForeignKey
ALTER TABLE "public"."ReplyTemplate" ADD CONSTRAINT "ReplyTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KnowledgeBaseItem" ADD CONSTRAINT "KnowledgeBaseItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
