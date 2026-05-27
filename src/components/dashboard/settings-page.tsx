"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsData {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  fonnteToken: string | null;
  inboundOnlyMode: boolean;
  replyCooldownSeconds: number;
  perCustomerDailyLimit: number;
  dailyMessageLimit: number;
  businessOutgoingToday: number;
  businessLimitReached: boolean;
  setupCompleted: boolean;
  setupStep: number;
  whatsappNumber: string;
}

export function SettingsPageClient() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [fonnteToken, setFonnteToken] = useState("");
  const [inboundOnlyMode, setInboundOnlyMode] = useState(true);
  const [replyCooldownSeconds, setReplyCooldownSeconds] = useState("3");
  const [perCustomerDailyLimit, setPerCustomerDailyLimit] = useState("20");
  const [dailyMessageLimit, setDailyMessageLimit] = useState("500");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/webhooks/fonnte`,
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Gagal memuat settings");
      }

      const settings = result.data as SettingsData;
      setData(settings);
      setName(settings.name);
      setOwnerName(settings.ownerName);
      setPhone(settings.phone);
      setFonnteToken(settings.fonnteToken ?? "");
      setInboundOnlyMode(settings.inboundOnlyMode);
      setReplyCooldownSeconds(String(settings.replyCooldownSeconds));
      setPerCustomerDailyLimit(String(settings.perCustomerDailyLimit));
      setDailyMessageLimit(String(settings.dailyMessageLimit));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/fonnte`);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ownerName,
          phone,
          fonnteToken,
          inboundOnlyMode,
          replyCooldownSeconds: Number(replyCooldownSeconds),
          perCustomerDailyLimit: Number(perCustomerDailyLimit),
          dailyMessageLimit: Number(dailyMessageLimit),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menyimpan settings");
      }

      setSuccess("Settings berhasil diperbarui.");
      await loadSettings();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <DashboardTopbar
        title="Settings"
        description="Konfigurasi profil bisnis, token Fonnte, endpoint webhook, dan safe messaging."
      />

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert className="mb-4">
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {data?.businessLimitReached ? (
        <Alert variant="warning" className="mb-4">
          <AlertTitle>Business daily message limit reached.</AlertTitle>
          <AlertDescription>
            Kuota harian bisnis sudah mencapai batas. Pengiriman baru akan dibuka kembali besok.
          </AlertDescription>
        </Alert>
      ) : null}

      {data && !data.setupCompleted ? (
        <Alert variant="warning" className="mb-4">
          <AlertTitle>Setup Bisnis Belum Selesai</AlertTitle>
          <AlertDescription>
            Lengkapi setup langkah {data.setupStep}/7 agar AI bisa memberi rekomendasi yang akurat.
            {" "}
            <Link href="/dashboard/setup" className="font-semibold underline">
              Buka Setup
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Profil Bisnis & Safe Messaging</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <p className="text-sm text-zinc-500">Memuat settings...</p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label>Nama Bisnis</Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Nama Owner</Label>
                  <Input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon</Label>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email Login</Label>
                  <Input value={data.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Fonnte Token</Label>
                  <Input
                    type="password"
                    value={fonnteToken}
                    onChange={(event) => setFonnteToken(event.target.value)}
                    placeholder="Isi token Fonnte"
                  />
                </div>

                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p className="mb-3 text-sm font-medium text-zinc-900">Safe Messaging Settings</p>

                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Inbound Only Mode</p>
                      <p className="text-xs text-zinc-500">
                        Hanya boleh membalas customer yang sudah pernah chat duluan.
                      </p>
                    </div>
                    <Switch checked={inboundOnlyMode} onCheckedChange={setInboundOnlyMode} />
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label>Reply Cooldown (detik)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={replyCooldownSeconds}
                        onChange={(event) => setReplyCooldownSeconds(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Limit Harian per Customer</Label>
                      <Input
                        type="number"
                        min="1"
                        max="500"
                        value={perCustomerDailyLimit}
                        onChange={(event) => setPerCustomerDailyLimit(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Limit Harian per Bisnis</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10000"
                        value={dailyMessageLimit}
                        onChange={(event) => setDailyMessageLimit(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Settings"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook & Safety Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-zinc-600">Webhook URL</p>
              <code className="mt-1 block rounded-md bg-zinc-100 p-2 text-xs text-zinc-800">{webhookUrl}</code>
            </div>
            <div className="rounded-md border border-zinc-200 p-3 text-sm text-zinc-700">
              <p>
                Outgoing hari ini: <span className="font-semibold">{data?.businessOutgoingToday ?? 0}</span> /
                <span className="font-semibold"> {data?.dailyMessageLimit ?? 0}</span>
              </p>
            </div>

            <Alert variant="warning">
              <AlertTitle>Peringatan</AlertTitle>
              <AlertDescription>
                Fonnte is unofficial WhatsApp API. Use a secondary number and avoid spam/broadcast without consent.
              </AlertDescription>
            </Alert>

            <Alert variant="warning">
              <AlertTitle>WhatsApp Safety Mitigation</AlertTitle>
              <AlertDescription>
                To reduce WhatsApp ban risk, this app is designed for inbound replies only. Avoid blasting messages to
                numbers that never contacted your business.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
