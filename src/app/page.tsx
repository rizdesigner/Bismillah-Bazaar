import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export const runtime = 'edge';
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      redirect("/admin");
    }

    if (profile?.role === "customer") {
      redirect("/catalog");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-zinc-50 px-6">
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 text-3xl font-bold text-white shadow-lg shadow-emerald-600/20">
          B
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Bismillah Bazaar
        </h1>
        <p className="mt-2 text-sm font-medium text-emerald-700">100% Halal</p>
        <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-600">
          Wholesale halal meat ordering for restaurants. Browse the daily
          catalog, submit a purchase order, and confirm the final quote from
          our team.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-center text-base font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="w-full rounded-2xl border border-emerald-600 px-6 py-4 text-center text-base font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            Register Restaurant
          </Link>
        </div>
        <p className="mt-6 text-xs text-zinc-500">
          For registered restaurant accounts only
        </p>
      </div>
    </div>
  );
}
