import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function LocaleIndexPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
