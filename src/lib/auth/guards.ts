import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("auth/sign-in");
  const user = await prisma.user.findUnique({
    where: { id: session?.user.id },
    select: { teamId: true },
  })
  const TeamId = user ? user.teamId : "default-team"
  return {teamId: TeamId, ...session};
}

export async function requireRole(required: "admin" | "agent") {
  const session = await requireSession();
  if (required === "admin" && session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}