import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import TrakteerWidget from "@/components/TrakteerWidget";
import { db } from "@/db";
import { stockAlerts } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [alertCountResult] = await db
    .select({ count: count() })
    .from(stockAlerts)
    .where(eq(stockAlerts.isRead, false));

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar user={session} alertCount={alertCountResult?.count || 0} />
      <main className="flex-1 lg:ml-0 overflow-auto min-h-screen pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          {children}
        </div>
        <TrakteerWidget />
      </main>
    </div>
  );
}
