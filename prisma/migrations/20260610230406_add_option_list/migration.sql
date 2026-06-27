-- CreateTable
CREATE TABLE "OptionList" (
    "id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "OptionList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptionList_field_idx" ON "OptionList"("field");

-- CreateIndex
CREATE UNIQUE INDEX "OptionList_field_value_key" ON "OptionList"("field", "value");
