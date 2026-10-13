-- CreateTable
CREATE TABLE "EmailChange" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "newEmail" VARCHAR(255) NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifyCode" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifyCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailChange_newEmail_idx" ON "EmailChange"("newEmail");

-- CreateIndex
CREATE UNIQUE INDEX "EmailChange_userId_newEmail_key" ON "EmailChange"("userId", "newEmail");

-- CreateIndex
CREATE INDEX "VerifyCode_email_idx" ON "VerifyCode"("email");

-- AddForeignKey
ALTER TABLE "EmailChange" ADD CONSTRAINT "EmailChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
