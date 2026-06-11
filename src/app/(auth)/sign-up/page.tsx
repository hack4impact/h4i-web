import { auth } from "@/lib/authn";
import { redirect } from "next/navigation";
import SignUpForm from "./SignUpForm";
import { notionApi } from "@/lib/notion";
import { db } from "@/lib/db";
import {
  MAJOR_SUGGESTIONS,
  GENDER_SUGGESTIONS,
  RACE_SUGGESTIONS,
} from "@/lib/field-options";

export default async function SignUpPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const [chapters, majorRows, employerRows, genderRows, raceRows] =
    await Promise.all([
      notionApi
        .getChapters()
        .then((all) =>
          all
            .filter((c) => c.status === "Active" || c.status === "Forming")
            .sort((a, b) => a.university.localeCompare(b.university))
            .map((c) => ({ id: c.id, university: c.university }))
        )
        .catch(() => [] as { id: string; university: string }[]),
      db.optionList.findMany({
        where: { field: "major" },
        orderBy: { value: "asc" },
        select: { value: true },
      }),
      db.optionList.findMany({
        where: { field: "employer" },
        orderBy: { value: "asc" },
        select: { value: true },
      }),
      db.optionList.findMany({
        where: { field: "gender" },
        orderBy: { order: "asc" },
        select: { value: true },
      }),
      db.optionList.findMany({
        where: { field: "race_ethnicity" },
        orderBy: { order: "asc" },
        select: { value: true },
      }),
    ]);

  return (
    <main className="bg-root flex min-h-screen items-center justify-center py-12">
      <SignUpForm
        chapters={chapters}
        majorOptions={
          majorRows.length > 0
            ? majorRows.map((r) => r.value)
            : MAJOR_SUGGESTIONS
        }
        employerOptions={employerRows.map((r) => r.value)}
        genderOptions={(genderRows.length > 0
          ? genderRows.map((r) => r.value)
          : GENDER_SUGGESTIONS
        ).map((v) => ({ value: v, label: v }))}
        raceOptions={(raceRows.length > 0
          ? raceRows.map((r) => r.value)
          : RACE_SUGGESTIONS
        ).map((v) => ({ value: v, label: v }))}
      />
    </main>
  );
}
