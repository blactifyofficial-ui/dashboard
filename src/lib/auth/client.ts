"use client";

export interface SignOutOptions {
  fetchOptions?: {
    onSuccess?: () => void;
  };
}

export const authClient = {
  signIn: {
    social: async ({
      provider,
      callbackURL = "/dashboard",
    }: {
      provider: string;
      callbackURL?: string;
    }) => {
      if (provider === "google") {
        const targetUrl = `/api/auth/google?callbackURL=${encodeURIComponent(callbackURL)}`;
        window.location.href = targetUrl;
      } else {
        throw new Error(`Unsupported social provider: ${provider}`);
      }
    },
  },

  signOut: async (options?: SignOutOptions) => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[authClient] Failed to sign out:", err);
    }

    if (options?.fetchOptions?.onSuccess) {
      options.fetchOptions.onSuccess();
    }
  },

  getSession: async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) return { data: null };
      return await res.json();
    } catch {
      return { data: null };
    }
  },
};
