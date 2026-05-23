"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UseAdminAccessState = {
  canAccess: boolean;
  ready: boolean;
};

export function useAdminAccess(): UseAdminAccessState {
  const [state, setState] = useState<UseAdminAccessState>({
    canAccess: false,
    ready: false
  });

  useEffect(() => {
    let mounted = true;

    async function loadAccess() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        if (mounted) {
          setState({ canAccess: false, ready: true });
        }
        return;
      }

      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setState({ canAccess: false, ready: true });
        return;
      }

      try {
        const response = await fetch("/api/admin/access", { cache: "no-store" });
        const payload = (await response.json()) as { canAccess?: boolean };

        if (mounted) {
          setState({ canAccess: Boolean(payload.canAccess), ready: true });
        }
      } catch {
        if (mounted) {
          setState({ canAccess: false, ready: true });
        }
      }
    }

    loadAccess();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
