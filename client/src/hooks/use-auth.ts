import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch auth state");
      return api.auth.me.responses[200].parse(await res.json());
    },
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.login.input>) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || (res.status === 401 ? "Invalid credentials" : "Login failed"));
      }
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.register.input>) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return api.auth.register.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    requestOTP: useMutation({
      mutationFn: async (credentials: z.infer<typeof api.auth.requestOTP.input>) => {
        const res = await fetch(api.auth.requestOTP.path, {
          method: api.auth.requestOTP.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to send OTP");
        }
        return await res.json();
      },
    }).mutateAsync,
    verifyOTP: useMutation({
      mutationFn: async (data: z.infer<typeof api.auth.verifyOTP.input>) => {
        const res = await fetch(api.auth.verifyOTP.path, {
          method: api.auth.verifyOTP.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Invalid OTP");
        }
        return await res.json();
      },
      onSuccess: (data) => {
        queryClient.setQueryData([api.auth.me.path], data);
      },
    }).mutateAsync,
    forgotPassword: useMutation({
      mutationFn: async (email: string) => {
        const res = await fetch(api.auth.forgotPassword.path, {
          method: api.auth.forgotPassword.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to send reset OTP");
        }
        return await res.json();
      },
    }).mutateAsync,
    resetPassword: useMutation({
      mutationFn: async (data: z.infer<typeof api.auth.resetPassword.input>) => {
        const res = await fetch(api.auth.resetPassword.path, {
          method: api.auth.resetPassword.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to reset password");
        }
        return await res.json();
      },
    }).mutateAsync,
  };
}
