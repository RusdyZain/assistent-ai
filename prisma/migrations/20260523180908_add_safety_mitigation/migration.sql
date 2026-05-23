-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('hot', 'warm', 'cold', 'complaint', 'deal', 'lost');

-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('open', 'closed', 'rate_limited');

-- CreateEnum
CREATE TYPE "public"."MessageDirection" AS ENUM ('incoming', 'outgoing');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('draft', 'confirmed', 'waiting_payment', 'paid', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "public"."FollowUpStatus" AS ENUM ('pending', 'sent', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."MessageSendStatus" AS ENUM ('pending', 'sent', 'failed', 'blocked');

-- CreateTable
CREATE TABLE "public"."Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fonnteToken" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "dailyMessageLimit" INTEGER NOT NULL DEFAULT 500,
    "perCustomerDailyLimit" INTEGER NOT NULL DEFAULT 20,
    "replyCooldownSeconds" INTEGER NOT NULL DEFAULT 3,
    "inboundOnlyMode" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "leadStatus" "public"."LeadStatus" NOT NULL DEFAULT 'cold',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optIn" BOOLEAN NOT NULL DEFAULT true,
    "spamSuspected" BOOLEAN NOT NULL DEFAULT false,
    "spamReason" TEXT,
    "lastIncomingAt" TIMESTAMP(3),
    "lastOutgoingAt" TIMESTAMP(3),
    "outgoingCountToday" INTEGER NOT NULL DEFAULT 0,
    "outgoingCountDate" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'open',
    "summary" TEXT,
    "lastIntent" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "public"."MessageDirection" NOT NULL,
    "message" TEXT NOT NULL,
    "rawPayload" JSONB,
    "fonnteInboxId" TEXT,
    "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageSendLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "conversationId" TEXT,
    "message" TEXT NOT NULL,
    "status" "public"."MessageSendStatus" NOT NULL DEFAULT 'pending',
    "blockedReason" TEXT,
    "fonnteResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageSendLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "conversationId" TEXT,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'draft',
    "items" JSONB NOT NULL,
    "totalEstimate" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FollowUp" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "conversationId" TEXT,
    "message" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."FollowUpStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'fonnte',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_email_key" ON "public"."Business"("email");

-- CreateIndex
CREATE INDEX "Customer_businessId_leadStatus_idx" ON "public"."Customer"("businessId", "leadStatus");

-- CreateIndex
CREATE INDEX "Customer_businessId_lastMessageAt_idx" ON "public"."Customer"("businessId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_phone_key" ON "public"."Customer"("businessId", "phone");

-- CreateIndex
CREATE INDEX "Conversation_businessId_status_idx" ON "public"."Conversation"("businessId", "status");

-- CreateIndex
CREATE INDEX "Conversation_customerId_status_idx" ON "public"."Conversation"("customerId", "status");

-- CreateIndex
CREATE INDEX "Conversation_businessId_lastMessageAt_idx" ON "public"."Conversation"("businessId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_businessId_createdAt_idx" ON "public"."Message"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "public"."Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_customerId_createdAt_idx" ON "public"."Message"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageSendLog_businessId_status_createdAt_idx" ON "public"."MessageSendLog"("businessId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MessageSendLog_customerId_createdAt_idx" ON "public"."MessageSendLog"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageSendLog_conversationId_createdAt_idx" ON "public"."MessageSendLog"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_businessId_isActive_idx" ON "public"."Product"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "Product_businessId_category_idx" ON "public"."Product"("businessId", "category");

-- CreateIndex
CREATE INDEX "Order_businessId_status_idx" ON "public"."Order"("businessId", "status");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "public"."Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_conversationId_idx" ON "public"."Order"("conversationId");

-- CreateIndex
CREATE INDEX "FollowUp_businessId_status_idx" ON "public"."FollowUp"("businessId", "status");

-- CreateIndex
CREATE INDEX "FollowUp_scheduledAt_idx" ON "public"."FollowUp"("scheduledAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_businessId_createdAt_idx" ON "public"."WebhookEvent"("businessId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageSendLog" ADD CONSTRAINT "MessageSendLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageSendLog" ADD CONSTRAINT "MessageSendLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageSendLog" ADD CONSTRAINT "MessageSendLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FollowUp" ADD CONSTRAINT "FollowUp_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FollowUp" ADD CONSTRAINT "FollowUp_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FollowUp" ADD CONSTRAINT "FollowUp_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebhookEvent" ADD CONSTRAINT "WebhookEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
