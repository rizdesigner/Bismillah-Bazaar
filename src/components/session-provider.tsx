"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  email: string;
  role: string;
  status: string;
  restaurant_name: string | null;
  phone: string | null;
  location: string | null;
};

type SessionContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const loadProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (active) setProfile(data ?? null);
      } catch {
        if (active) setProfile(null);
      }
    };

    const getSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        setUser(user);
        if (user) await loadProfile(user.id);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          loadProfile(session.user.id);
          if (event === "SIGNED_IN") {
            // Navigate straight to the app; the server-side "/" redirect
            // picks the correct dashboard (admin/catalog/pending).
            router.replace("/");
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <SessionContext.Provider value={{ user, profile, loading }}>
      {children}
    </SessionContext.Provider>
  );
}
