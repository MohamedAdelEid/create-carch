export function nextAuthTypesTemplate() {
  return `import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    accessToken: string;
    expiresAt: string;
    photo?: string | null;
    phoneNumber?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      photo?: string | null;
      phoneNumber?: string | null;
    };
    accessToken: string;
    expiresAt: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    accessToken: string;
    expiresAt: string;
    photo?: string | null;
    phoneNumber?: string | null;
  }
}
`;
}

export function nextAuthConfigTemplate() {
  return `import type { NextAuthConfig } from "next-auth";

export const nextAuthConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn   = !!auth?.user;
      const isPublicPath =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register");
      if (isPublicPath) return true;
      return isLoggedIn;
    },
  },
};
`;
}

export function nextAuthTemplate() {
  return `import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { nextAuthConfig } from "./nextAuth.config";
import "./nextAuth.types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...nextAuthConfig,

  providers: [
    Credentials({
      credentials: {
        user:        {},
        accessToken: {},
        expiresAt:   {},
      },
      async authorize(credentials) {
        if (!credentials?.user) return null;
        try {
          const parsed = JSON.parse(credentials.user as string);
          if (!parsed.id || !parsed.email) return null;
          return {
            id:          parsed.id,
            name:        parsed.name,
            email:       parsed.email,
            role:        parsed.role,
            accessToken: credentials.accessToken as string,
            expiresAt:   credentials.expiresAt as string,
            photo:       parsed.photo ?? null,
            phoneNumber: parsed.phoneNumber ?? null,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    ...nextAuthConfig.callbacks,

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id          = user.id!;
        token.name        = user.name!;
        token.email       = user.email!;
        token.role        = user.role;
        token.accessToken = user.accessToken;
        token.expiresAt   = user.expiresAt;
        token.photo       = user.photo ?? null;
        token.phoneNumber = user.phoneNumber ?? null;
      }

      if (trigger === "update" && session) {
        if (session.accessToken   !== undefined) token.accessToken   = session.accessToken;
        if (session.expiresAt     !== undefined) token.expiresAt     = session.expiresAt;
        if (session.name          !== undefined) token.name          = session.name;
        if (session.email         !== undefined) token.email         = session.email;
        if (session.role          !== undefined) token.role          = session.role;
        if (session.photo         !== undefined) token.photo         = session.photo;
        if (session.phoneNumber   !== undefined) token.phoneNumber   = session.phoneNumber;
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id:          token.id,
        name:        token.name ?? "",
        email:       token.email ?? "",
        role:        token.role,
        photo:       token.photo ?? null,
        phoneNumber: token.phoneNumber ?? null,
      };
      session.accessToken = token.accessToken;
      session.expiresAt   = token.expiresAt;
      return session;
    },
  },
});
`;
}

export function nextAuthRouteTemplate() {
  return `import { handlers } from "@/shared/infrastructure/auth/nextAuth";

export const { GET, POST } = handlers;
`;
}

export function authApiTemplate() {
  return `import { httpClient } from "@/shared/infrastructure/http/httpClient";
import type {
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
  VerifyEmailOtpPayload,
  SendEmailOtpPayload,
  ResetPasswordPayload,
} from "../domain/types/auth.types";

async function register(credentials: RegisterCredentials): Promise<RegisterResponse> {
  const result = await httpClient.post<RegisterResponse>({
    url: "/auth/register",
    data: credentials,
  });
  if (!result.data) throw new Error(result.message ?? "Registration failed");
  return result.data;
}

async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const result = await httpClient.post<LoginResponse>({
    url: "/auth/login",
    data: credentials,
    withCredentials: true,
  });
  if (!result.data) throw new Error(result.message ?? "Login failed");
  return result.data;
}

async function logout(): Promise<void> {
  const result = await httpClient.post<unknown>({
    url: "/auth/logout",
    withCredentials: true,
    data: {},
  });
  if (result.error) throw new Error(result.error.message ?? "Logout failed");
}

async function refreshToken(): Promise<LoginResponse> {
  const result = await httpClient.post<LoginResponse>({
    url: "/auth/refresh-token",
    withCredentials: true,
  });
  if (!result.data) throw new Error(result.message ?? "Refresh failed");
  return result.data;
}

async function verifyEmailOtp(payload: VerifyEmailOtpPayload): Promise<void> {
  const result = await httpClient.post<unknown>({
    url: "/auth/verify-email-otp",
    data: payload,
  });
  if (result.error) throw new Error(result.error.message ?? "Verification failed");
}

async function sendEmailOtp(payload: SendEmailOtpPayload): Promise<void> {
  const result = await httpClient.post<unknown>({
    url: "/auth/send-email-otp",
    data: payload,
  });
  if (result.error) throw new Error(result.message ?? "Send OTP failed");
}

async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  const result = await httpClient.post<unknown>({
    url: "/auth/reset-password",
    data: payload,
  });
  if (result.error) throw new Error(result.error.message ?? "Reset password failed");
}

export const authApi = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmailOtp,
  sendEmailOtp,
  resetPassword,
};
`;
}

export function authTypesTemplate() {
  return `export type LoginCredentials = {
  email:    string;
  password: string;
};

export type LoginResponse = {
  user: {
    id:           string;
    name:         string;
    email:        string;
    role:         string;
    photo?:       string | null;
    phoneNumber?: string | null;
  };
  accessToken: string;
  expiresAt:   string;
};

export type RegisterCredentials = {
  name:     string;
  email:    string;
  password: string;
};

export type RegisterResponse     = LoginResponse;
export type VerifyEmailOtpPayload = { email: string; otp: string };
export type SendEmailOtpPayload   = { email: string };
export type ResetPasswordPayload  = { email: string; otp: string; newPassword: string };
`;
}

export function authSchemasTemplate() {
  return `import { z } from "zod";

export const loginSchema = z.object({
  email:    z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name:            z.string().min(2, "Name must be at least 2 characters"),
    email:           z.string().email("Invalid email"),
    password:        z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const sendOtpSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z.object({
  email:       z.string().email("Invalid email"),
  otp:         z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues     = z.infer<typeof loginSchema>;
export type RegisterFormValues  = z.infer<typeof registerSchema>;
export type SendOtpValues       = z.infer<typeof sendOtpSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
`;
}

export function useLoginTemplate() {
  return `import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { authApi } from "../../infrastructure/api/auth.api";
import { notify } from "@/shared/application/lib/toast";
import type { LoginFormValues } from "../schemas/auth.schemas";

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const response = await authApi.login(values);
      await signIn("credentials", {
        redirect:    false,
        user:        JSON.stringify(response.user),
        accessToken: response.accessToken,
        expiresAt:   response.expiresAt,
      });
      return response;
    },
    onSuccess: (data) => {
      notify.success("Welcome back!");
      router.push(\`/\${data.user.role}/dashboard\`);
    },
    onError: (error: Error) => notify.error(error.message),
  });
}
`;
}

export function useRegisterTemplate() {
  return `import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { authApi } from "../../infrastructure/api/auth.api";
import { notify } from "@/shared/application/lib/toast";
import type { RegisterFormValues } from "../schemas/auth.schemas";

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      const { confirmPassword: _, ...credentials } = values;
      const response = await authApi.register(credentials);
      await signIn("credentials", {
        redirect:    false,
        user:        JSON.stringify(response.user),
        accessToken: response.accessToken,
        expiresAt:   response.expiresAt,
      });
      return response;
    },
    onSuccess: (data) => {
      notify.success("Account created!");
      router.push(\`/\${data.user.role}/dashboard\`);
    },
    onError: (error: Error) => notify.error(error.message),
  });
}
`;
}

export function useLogoutTemplate() {
  return `import { useMutation } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { authApi } from "../../infrastructure/api/auth.api";
import { notify } from "@/shared/application/lib/toast";

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
      await signOut({ redirect: false });
    },
    onSuccess: () => {
      window.location.href = "/login";
    },
    onError: () => notify.error("Logout failed"),
  });
}
`;
}

export function loginPageTemplate() {
  return `"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginSchema, type LoginFormValues } from "../../application/schemas/auth.schemas";
import { useLogin } from "../../application/hooks/useLogin";

export function LoginPage() {
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver:      zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => login(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

export function registerPageTemplate() {
  return `"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { registerSchema, type RegisterFormValues } from "../../application/schemas/auth.schemas";
import { useRegister } from "../../application/hooks/useRegister";

export function RegisterPage() {
  const { mutate: register, isPending } = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver:      zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => register(v))} className="space-y-4">
              {(["name", "email", "password", "confirmPassword"] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">{name.replace(/([A-Z])/g, " $1")}</FormLabel>
                      <FormControl>
                        <Input
                          type={name.includes("assword") ? "password" : name === "email" ? "email" : "text"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

export function shadcnAuthComponents() {
  return [
    "button",
    "input",
    "form",
    "card",
    "label",
  ];
}
