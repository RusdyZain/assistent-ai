"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BRAND_TONE_OPTIONS, BUSINESS_CATEGORY_OPTIONS, SETUP_STEPS } from "@/lib/setup";

interface SetupData {
  setupCompleted: boolean;
  setupStep: number;
  steps: boolean[];
  counts: {
    productCount: number;
    templateCount: number;
    knowledgeCount: number;
  };
  businessProfile: {
    businessName: string;
    businessCategory: string;
    businessDescription: string;
    businessLocation: string;
    serviceArea: string;
    operatingHours: string;
    whatsappNumber: string;
    replyLanguage: string;
    brandTone: string;
  };
  salesRules: {
    acceptsCOD: boolean;
    acceptsTransfer: boolean;
    acceptsQRIS: boolean;
    requiresDownPayment: boolean;
    downPaymentAmount: number | null;
    downPaymentPercentage: number | null;
    allowNegotiation: boolean;
    minimumOrder: number | null;
    refundPolicy: string;
    reschedulePolicy: string;
    shippingPolicy: string;
    paymentInstructions: string;
    orderProcess: string;
  };
  followUpRules: {
    warmLeadFollowUpHours: number;
    hotLeadFollowUpHours: number;
    closingPriorityFollowUpHours: number;
    waitingPaymentFollowUpHours: number;
    maxFollowUpCount: number;
    markLostAfterDays: number;
  };
  fonnteConnection: {
    fonnteToken: string;
    whatsappNumber: string;
    webhookUrl: string;
  };
}

function NumberInput({
  value,
  onChange,
  min = 0,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
}) {
  return (
    <Input
      type="number"
      min={min}
      value={value ?? ""}
      onChange={(event) => {
        const raw = event.target.value;
        if (!raw) {
          onChange(null);
          return;
        }
        onChange(Number(raw));
      }}
    />
  );
}

export function SetupPageClient() {
  const [data, setData] = useState<SetupData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testTarget, setTestTarget] = useState("");

  const loadSetup = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/setup", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal memuat setup");
      }

      const setupData = result.data as SetupData;
      setData(setupData);
      setCurrentStep(setupData.setupStep);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat setup");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSetup();
  }, [loadSetup]);

  const completedCount = useMemo(() => {
    return data?.steps.filter(Boolean).length ?? 0;
  }, [data]);

  const saveSection = async (section: string, payload: unknown, message: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, payload }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menyimpan setup");
      }

      setSuccess(message);
      await loadSetup();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan setup");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!data) return;
    await saveSection("business_profile", data.businessProfile, "Profil bisnis berhasil disimpan.");
  };

  const handleSaveSalesRules = async (event: FormEvent) => {
    event.preventDefault();
    if (!data) return;
    await saveSection("sales_rules", data.salesRules, "Aturan penjualan berhasil disimpan.");
  };

  const handleSaveFollowUpRules = async (event: FormEvent) => {
    event.preventDefault();
    if (!data) return;
    await saveSection("follow_up_rules", data.followUpRules, "Aturan follow-up berhasil disimpan.");
  };

  const handleSaveFonnte = async (event: FormEvent) => {
    event.preventDefault();
    if (!data) return;
    await saveSection("fonnte_connection", data.fonnteConnection, "Koneksi Fonnte berhasil disimpan.");
  };

  const handleTestFonnte = async () => {
    if (!testTarget.trim()) {
      setError("Nomor target test wajib diisi.");
      return;
    }

    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/setup/fonnte-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: testTarget.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal kirim test message");
      }

      setSuccess("Test message berhasil dikirim ke target.");
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Gagal kirim test message");
    } finally {
      setTesting(false);
    }
  };

  const handleCompleteSetup = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/setup/complete", {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Setup belum lengkap.");
      }

      setSuccess("Setup bisnis selesai. AI siap digunakan.");
      await loadSetup();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Gagal menyelesaikan setup");
    } finally {
      setSaving(false);
    }
  };

  if (!data || loading) {
    return (
      <div>
        <DashboardTopbar
          title="Setup Bisnis"
          description="Lengkapi data bisnis agar AI bisa memberi rekomendasi sales yang akurat."
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500">Memuat setup bisnis...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isStepDone = (step: number) => data.steps[step - 1];

  return (
    <div>
      <DashboardTopbar
        title="Setup Bisnis"
        description="Lengkapi konteks bisnis sebelum AI menganalisis chat dan membantu closing."
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

      {!data.setupCompleted ? (
        <Alert variant="warning" className="mb-4">
          <AlertTitle>Setup belum selesai</AlertTitle>
          <AlertDescription>
            Lengkapi seluruh langkah agar AI tidak mengarang harga, kebijakan, atau info layanan.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-900">Progress Setup</p>
          <p className="text-sm text-zinc-600">
            {completedCount}/{SETUP_STEPS.length} langkah selesai
          </p>
        </div>
        <div className="h-2 rounded-full bg-zinc-100">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(completedCount / SETUP_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {SETUP_STEPS.map((item) => {
            const done = isStepDone(item.step);
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setCurrentStep(item.step)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                  currentStep === item.step
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <p className="font-medium text-zinc-900">
                  {item.step}. {item.label}
                </p>
                <p className={`text-xs ${done ? "text-emerald-700" : "text-zinc-500"}`}>
                  {done ? "Selesai" : "Belum selesai"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {currentStep === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>1. Profil Bisnis</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSaveProfile}>
              <div className="space-y-2">
                <Label>Nama Bisnis</Label>
                <Input
                  required
                  value={data.businessProfile.businessName}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            businessProfile: { ...prev.businessProfile, businessName: event.target.value },
                          }
                        : prev,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Kategori Bisnis</Label>
                <Input
                  required
                  list="business-category-options"
                  value={data.businessProfile.businessCategory}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            businessProfile: { ...prev.businessProfile, businessCategory: event.target.value },
                          }
                        : prev,
                    )
                  }
                />
                <datalist id="business-category-options">
                  {BUSINESS_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi Bisnis</Label>
                <Textarea
                  required
                  rows={3}
                  value={data.businessProfile.businessDescription}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            businessProfile: { ...prev.businessProfile, businessDescription: event.target.value },
                          }
                        : prev,
                    )
                  }
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Lokasi Bisnis</Label>
                  <Input
                    required
                    value={data.businessProfile.businessLocation}
                    onChange={(event) =>
                      setData((prev) =>
                        prev
                          ? {
                              ...prev,
                              businessProfile: { ...prev.businessProfile, businessLocation: event.target.value },
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Area Layanan</Label>
                  <Input
                    required
                    value={data.businessProfile.serviceArea}
                    onChange={(event) =>
                      setData((prev) =>
                        prev
                          ? {
                              ...prev,
                              businessProfile: { ...prev.businessProfile, serviceArea: event.target.value },
                            }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Jam Operasional</Label>
                  <Input
                    required
                    value={data.businessProfile.operatingHours}
                    onChange={(event) =>
                      setData((prev) =>
                        prev
                          ? {
                              ...prev,
                              businessProfile: { ...prev.businessProfile, operatingHours: event.target.value },
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomor WhatsApp</Label>
                  <Input
                    required
                    value={data.businessProfile.whatsappNumber}
                    onChange={(event) =>
                      setData((prev) =>
                        prev
                          ? {
                              ...prev,
                              businessProfile: { ...prev.businessProfile, whatsappNumber: event.target.value },
                            }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bahasa Balasan</Label>
                  <Input
                    required
                    value={data.businessProfile.replyLanguage}
                    onChange={(event) =>
                      setData((prev) =>
                        prev
                          ? {
                              ...prev,
                              businessProfile: { ...prev.businessProfile, replyLanguage: event.target.value },
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brand Tone</Label>
                  <Input
                    required
                    list="brand-tone-options"
                    value={data.businessProfile.brandTone}
                    onChange={(event) =>
                      setData((prev) =>
                        prev
                          ? {
                              ...prev,
                              businessProfile: { ...prev.businessProfile, brandTone: event.target.value },
                            }
                          : prev,
                      )
                    }
                  />
                  <datalist id="brand-tone-options">
                    {BRAND_TONE_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Profil"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Aturan Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSaveSalesRules}>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm">
                  Terima COD
                  <Switch
                    checked={data.salesRules.acceptsCOD}
                    onCheckedChange={(checked) =>
                      setData((prev) =>
                        prev
                          ? { ...prev, salesRules: { ...prev.salesRules, acceptsCOD: checked } }
                          : prev,
                      )
                    }
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm">
                  Terima Transfer
                  <Switch
                    checked={data.salesRules.acceptsTransfer}
                    onCheckedChange={(checked) =>
                      setData((prev) =>
                        prev
                          ? { ...prev, salesRules: { ...prev.salesRules, acceptsTransfer: checked } }
                          : prev,
                      )
                    }
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm">
                  Terima QRIS
                  <Switch
                    checked={data.salesRules.acceptsQRIS}
                    onCheckedChange={(checked) =>
                      setData((prev) =>
                        prev
                          ? { ...prev, salesRules: { ...prev.salesRules, acceptsQRIS: checked } }
                          : prev,
                      )
                    }
                  />
                </label>
              </div>

              <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm">
                Wajib DP
                <Switch
                  checked={data.salesRules.requiresDownPayment}
                  onCheckedChange={(checked) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, salesRules: { ...prev.salesRules, requiresDownPayment: checked } }
                        : prev,
                    )
                  }
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nominal DP</Label>
                  <NumberInput
                    value={data.salesRules.downPaymentAmount}
                    onChange={(value) =>
                      setData((prev) =>
                        prev
                          ? { ...prev, salesRules: { ...prev.salesRules, downPaymentAmount: value } }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Persentase DP (%)</Label>
                  <NumberInput
                    value={data.salesRules.downPaymentPercentage}
                    onChange={(value) =>
                      setData((prev) =>
                        prev
                          ? { ...prev, salesRules: { ...prev.salesRules, downPaymentPercentage: value } }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm">
                  Boleh Negosiasi
                  <Switch
                    checked={data.salesRules.allowNegotiation}
                    onCheckedChange={(checked) =>
                      setData((prev) =>
                        prev
                          ? { ...prev, salesRules: { ...prev.salesRules, allowNegotiation: checked } }
                          : prev,
                      )
                    }
                  />
                </label>
                <div className="space-y-2">
                  <Label>Minimum Order</Label>
                  <NumberInput
                    value={data.salesRules.minimumOrder}
                    onChange={(value) =>
                      setData((prev) =>
                        prev
                          ? { ...prev, salesRules: { ...prev.salesRules, minimumOrder: value } }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kebijakan Refund</Label>
                <Textarea
                  required
                  rows={3}
                  value={data.salesRules.refundPolicy}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, salesRules: { ...prev.salesRules, refundPolicy: event.target.value } }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Kebijakan Reschedule</Label>
                <Textarea
                  required
                  rows={3}
                  value={data.salesRules.reschedulePolicy}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, salesRules: { ...prev.salesRules, reschedulePolicy: event.target.value } }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Kebijakan Pengiriman</Label>
                <Textarea
                  required
                  rows={3}
                  value={data.salesRules.shippingPolicy}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, salesRules: { ...prev.salesRules, shippingPolicy: event.target.value } }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Instruksi Pembayaran</Label>
                <Textarea
                  required
                  rows={3}
                  value={data.salesRules.paymentInstructions}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            salesRules: { ...prev.salesRules, paymentInstructions: event.target.value },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Alur Proses Order</Label>
                <Textarea
                  required
                  rows={3}
                  value={data.salesRules.orderProcess}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? { ...prev, salesRules: { ...prev.salesRules, orderProcess: event.target.value } }
                        : prev,
                    )
                  }
                />
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Aturan Penjualan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle>3. Produk / Layanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-600">
              Tambahkan minimal 1 produk/layanan aktif agar AI bisa menjawab harga dan ketersediaan dengan akurat.
            </p>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
              Jumlah produk/layanan aktif:{" "}
              <span className="font-semibold">{data.counts.productCount}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/products">Buka Halaman Products</Link>
              </Button>
              <Button variant="outline" onClick={() => void loadSetup()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 4 ? (
        <Card>
          <CardHeader>
            <CardTitle>4. Template Balasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-600">
              Lengkapi 12 tipe template balasan agar AI konsisten mengikuti gaya bahasa bisnis Anda.
            </p>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
              Template aktif: <span className="font-semibold">{data.counts.templateCount}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/templates">Buka Halaman Templates</Link>
              </Button>
              <Button variant="outline" onClick={() => void loadSetup()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 5 ? (
        <Card>
          <CardHeader>
            <CardTitle>5. Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-600">
              Tambahkan pengetahuan bisnis (alamat, pembayaran, promo, FAQ) supaya AI tidak mengarang jawaban.
            </p>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
              Knowledge aktif: <span className="font-semibold">{data.counts.knowledgeCount}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/knowledge-base">Buka Halaman Knowledge Base</Link>
              </Button>
              <Button variant="outline" onClick={() => void loadSetup()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 6 ? (
        <Card>
          <CardHeader>
            <CardTitle>6. Aturan Follow-up</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSaveFollowUpRules}>
              <div className="space-y-2">
                <Label>Warm Lead Follow-up (jam)</Label>
                <Input
                  type="number"
                  min={1}
                  value={data.followUpRules.warmLeadFollowUpHours}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            followUpRules: {
                              ...prev.followUpRules,
                              warmLeadFollowUpHours: Number(event.target.value),
                            },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Hot Lead Follow-up (jam)</Label>
                <Input
                  type="number"
                  min={1}
                  value={data.followUpRules.hotLeadFollowUpHours}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            followUpRules: {
                              ...prev.followUpRules,
                              hotLeadFollowUpHours: Number(event.target.value),
                            },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Closing Priority Follow-up (jam)</Label>
                <Input
                  type="number"
                  min={1}
                  value={data.followUpRules.closingPriorityFollowUpHours}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            followUpRules: {
                              ...prev.followUpRules,
                              closingPriorityFollowUpHours: Number(event.target.value),
                            },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Waiting Payment Follow-up (jam)</Label>
                <Input
                  type="number"
                  min={1}
                  value={data.followUpRules.waitingPaymentFollowUpHours}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            followUpRules: {
                              ...prev.followUpRules,
                              waitingPaymentFollowUpHours: Number(event.target.value),
                            },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Maksimal Follow-up Count</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.followUpRules.maxFollowUpCount}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            followUpRules: {
                              ...prev.followUpRules,
                              maxFollowUpCount: Number(event.target.value),
                            },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Mark Lost After (hari)</Label>
                <Input
                  type="number"
                  min={1}
                  value={data.followUpRules.markLostAfterDays}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            followUpRules: {
                              ...prev.followUpRules,
                              markLostAfterDays: Number(event.target.value),
                            },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Aturan Follow-up"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 7 ? (
        <Card>
          <CardHeader>
            <CardTitle>7. Koneksi Fonnte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form className="space-y-3" onSubmit={handleSaveFonnte}>
              <div className="space-y-2">
                <Label>Fonnte Token</Label>
                <Input
                  type="password"
                  required
                  value={data.fonnteConnection.fonnteToken}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            fonnteConnection: { ...prev.fonnteConnection, fonnteToken: event.target.value },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor WhatsApp</Label>
                <Input
                  required
                  value={data.fonnteConnection.whatsappNumber}
                  onChange={(event) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            fonnteConnection: {
                              ...prev.fonnteConnection,
                              whatsappNumber: event.target.value,
                            },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input value={data.fonnteConnection.webhookUrl} disabled />
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="mb-2 text-sm font-medium text-zinc-900">Test Kirim Pesan</p>
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Nomor target test, contoh 62812..."
                    value={testTarget}
                    onChange={(event) => setTestTarget(event.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={handleTestFonnte} disabled={testing}>
                    {testing ? "Testing..." : "Kirim Test"}
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Koneksi Fonnte"}
              </Button>
            </form>

            <Alert variant="warning">
              <AlertTitle>Peringatan</AlertTitle>
              <AlertDescription>
                Fonnte is unofficial. Use a secondary number. Avoid spam, broadcast, and sending first
                messages to numbers that never contacted you.
              </AlertDescription>
            </Alert>

            <div className="pt-2">
              <Button onClick={handleCompleteSetup} disabled={saving || data.setupCompleted}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {data.setupCompleted ? "Setup Sudah Selesai" : "Selesaikan Setup"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentStep <= 1}
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          disabled={currentStep >= 7}
          onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
        >
          Berikutnya
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
