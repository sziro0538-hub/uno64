"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("USER:", user, "USER_ERROR:", userError);

      if (!user) {
        console.log("NO USER -> /");
        router.replace("/");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      console.log("PROFILE RAW:", profile, "ERROR:", error);

      if (error || !profile) {
        console.log("NO PROFILE -> /dashboard");
        router.replace("/dashboard");
        return;
      }

      const role = (profile.role || "").trim();
      console.log("PROFILE ROLE NORMALIZED:", role);

      if (role !== "admin") {
        console.log("ROLE IS NOT 'admin' -> /dashboard");
        router.replace("/dashboard");
        return;
      }

      console.log("ADMIN OK -> show admin");
      setAllowed(true);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return <p className="p-6">Checking admin access...</p>;
  }

  if (!allowed) return null;

  return <>{children}</>;
}
