import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("auth/sign-in");
  return session;
}

export async function requireRole(required: "admin" | "agent") {
  const session = await requireSession();
  if (required === "admin" && session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}
