"use server";

import { db } from "@/lib/db";

export async function addFieldOption(
  field: string,
  value: string
): Promise<void> {
  await db.optionList.createMany({
    data: [{ field, value }],
    skipDuplicates: true,
  });
}
