"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, Lock, Mail } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_BUSINESS_EMAIL,
  DEFAULT_LOGIN_PASSWORD,
} from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEFAULT_BUSINESS_EMAIL);
  const [password, setPassword] = useState(DEFAULT_LOGIN_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Login gagal");
        return;
      }

      router.push("/dashboard/inbox");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="hero-orb -left-20 top-8 h-64 w-64 bg-emerald-200/55" />
      <div className="hero-orb -right-20 top-18 h-72 w-72 bg-green-100/50" />

      <Card className="w-full max-w-md border-zinc-200/90">
        <CardHeader className="space-y-3">
          <Link
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800"
            href="/"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke landing page
          </Link>
          <div>
            <Image
              src="/logo.png"
              alt="WAI Sales Assistant"
              width={180}
              height={60}
              className="mb-3 h-8 w-auto"
              priority
            />
            <CardTitle className="text-2xl tracking-tight">
              Login WAI Sales Assistant
            </CardTitle>
            <CardDescription className="mt-1">
              Masuk ke dashboard inbox WhatsApp bisnis Anda.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Login gagal</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
