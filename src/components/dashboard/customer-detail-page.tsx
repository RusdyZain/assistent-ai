"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LeadStatusBadge } from "@/components/dashboard/lead-status-badge";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import { LEAD_STATUS_VALUES } from "@/types/sales";

interface CustomerDetail {
  id: string;
  name: string | null;
  phone: string;
  leadStatus: string;
  tags: string[];
  optIn: boolean;
  spamSuspected: boolean;
  spamReason: string | null;
  outgoingCountToday: number;
  lastOutgoingAt: string | null;
  conversations: Array<{
    id: string;
    summary: string | null;
    lastIntent: string | null;
    messages: Array<{
      id: string;
      direction: "incoming" | "outgoing";
      message: string;
      createdAt: string;
    }>;
  }>;
  orders: Array<{
    id: string;
    status: string;
    totalEstimate: string | null;
    notes: string | null;
    createdAt: string;
  }>;
}

export function CustomerDetailPageClient({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [leadStatus, setLeadStatus] = useState("cold");
  const [tagsText, setTagsText] = useState("");
  const [optIn, setOptIn] = useState(true);
  const [spamSuspected, setSpamSuspected] = useState(false);
  const [spamReason, setSpamReason] = useState("");

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${customerId}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal memuat detail customer");
      }

      const customer = data.data as CustomerDetail;
      setDetail(customer);
      setName(customer.name ?? "");
      setLeadStatus(customer.leadStatus);
      setTagsText(customer.tags.join(", "));
      setOptIn(customer.optIn);
      setSpamSuspected(customer.spamSuspected);
      setSpamReason(customer.spamReason ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat customer");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const orderedMessages = useMemo(() => {
    const all = detail?.conversations.flatMap((conversation) =>
      conversation.messages.map((message) => ({
        ...message,
        conversationId: conversation.id,
      })),
    );

    return (all ?? []).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [detail]);

  const handleSave = async () => {
    if (!detail) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/customers/${detail.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          leadStatus,
          tags: tagsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          optIn,
          spamSuspected,
          spamReason: spamReason || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menyimpan customer");
      }

      setSuccess("Data customer diperbarui.");
      await loadDetail();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal update customer");
    } finally {
      setSaving(false);
    }
  };

  const handleClearChat = async () => {
    if (!detail) return;

    const approved = window.confirm(
      "Hapus semua isi chat customer ini? Riwayat pesan akan dihapus permanen.",
    );
    if (!approved) return;

    setClearingChat(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/customers/${detail.id}?action=clear_chat`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menghapus isi chat customer");
      }

      setSuccess(`Isi chat customer berhasil dihapus (${data.deletedMessages ?? 0} pesan).`);
      await loadDetail();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Gagal menghapus isi chat customer");
    } finally {
      setClearingChat(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!detail) return;

    const approved = window.confirm(
      "Hapus customer ini beserta seluruh riwayat chat/order/follow-up terkait? Tindakan ini permanen.",
    );
    if (!approved) return;

    setDeletingCustomer(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/customers/${detail.id}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menghapus customer");
      }

      router.replace("/dashboard/customers");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus customer");
    } finally {
      setDeletingCustomer(false);
    }
  };

  return (
    <div>
      <DashboardTopbar title="Customer Detail" description="Profil customer, histori chat, dan riwayat order." />

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

      {loading || !detail ? (
        <Card>
          <CardContent className="py-6 text-sm text-zinc-500">Memuat detail customer...</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Profil Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama customer" />
              </div>
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input value={detail.phone} disabled />
              </div>
              <div className="space-y-2">
                <Label>Lead Status</Label>
                <Select value={leadStatus} onValueChange={setLeadStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUS_VALUES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags (pisahkan dengan koma)</Label>
                <Textarea rows={3} value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3">
                <div>
                  <p className="text-sm font-medium">Opt-in WhatsApp</p>
                  <p className="text-xs text-zinc-500">Kirim pesan hanya jika customer setuju.</p>
                </div>
                <Switch checked={optIn} onCheckedChange={setOptIn} />
              </div>
              <div className="space-y-2 rounded-md border border-zinc-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Spam Suspected</p>
                    <p className="text-xs text-zinc-500">
                      Tandai jika customer mengirim pesan berlebihan dalam waktu singkat.
                    </p>
                  </div>
                  <Switch checked={spamSuspected} onCheckedChange={setSpamSuspected} />
                </div>
                <div className="space-y-1">
                  <Label>Spam Reason</Label>
                  <Textarea
                    rows={2}
                    value={spamReason}
                    onChange={(event) => setSpamReason(event.target.value)}
                    placeholder="Alasan deteksi spam"
                  />
                </div>
                {spamSuspected ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSpamSuspected(false);
                      setSpamReason("");
                    }}
                  >
                    Reset Spam Status
                  </Button>
                ) : null}
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving || clearingChat || deletingCustomer}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleClearChat}
                disabled={saving || clearingChat || deletingCustomer}
              >
                {clearingChat ? "Menghapus Isi Chat..." : "Hapus Isi Chat Customer"}
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                onClick={handleDeleteCustomer}
                disabled={saving || clearingChat || deletingCustomer}
              >
                {deletingCustomer ? "Menghapus Customer..." : "Hapus Customer"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ringkasan</CardTitle>
                  <LeadStatusBadge status={detail.leadStatus} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {detail.conversations.length === 0 ? (
                  <p className="text-sm text-zinc-500">Belum ada percakapan.</p>
                ) : (
                  detail.conversations.map((conversation) => (
                    <div key={conversation.id} className="rounded-md border border-zinc-200 p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Conversation {conversation.id}</p>
                      <p className="mt-1 text-sm text-zinc-800">{conversation.summary || "Belum ada summary"}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">Intent: {conversation.lastIntent || "-"}</Badge>
                      </div>
                    </div>
                  ))
                )}
                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                  <p>
                    Outgoing hari ini: <span className="font-semibold">{detail.outgoingCountToday}</span>
                  </p>
                  <p>
                    Last outgoing: <span className="font-semibold">{formatDateTime(detail.lastOutgoingAt)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Chat</CardTitle>
              </CardHeader>
              <CardContent>
                {orderedMessages.length === 0 ? (
                  <p className="text-sm text-zinc-500">Belum ada pesan.</p>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-auto">
                    {orderedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                          message.direction === "incoming"
                            ? "mr-auto bg-zinc-100 text-zinc-900"
                            : "ml-auto bg-emerald-600 text-white"
                        }`}
                      >
                        <p>{message.message}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            message.direction === "incoming" ? "text-zinc-500" : "text-emerald-100"
                          }`}
                        >
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.orders.length === 0 ? (
                  <p className="text-sm text-zinc-500">Belum ada order.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead>Dibuat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.status}</TableCell>
                          <TableCell>{formatRupiah(order.totalEstimate)}</TableCell>
                          <TableCell>{order.notes || "-"}</TableCell>
                          <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
