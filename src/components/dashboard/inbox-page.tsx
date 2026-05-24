"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LeadStatusBadge } from "@/components/dashboard/lead-status-badge";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, truncate } from "@/lib/utils";
import { LEAD_STATUS_VALUES } from "@/types/sales";

interface ConversationCard {
  id: string;
  status: "open" | "closed" | "rate_limited";
  summary: string | null;
  lastIntent: string | null;
  lastMessageAt: string | null;
  customer: {
    id: string;
    name: string | null;
    phone: string;
    leadStatus: string;
    spamSuspected: boolean;
    outgoingCountToday: number;
    lastOutgoingAt: string | null;
  };
  lastMessage: {
    message: string;
    direction: "incoming" | "outgoing";
    createdAt: string;
  } | null;
}

interface SendGuard {
  allowed: boolean;
  reason?: string;
  code?:
    | "NO_INBOUND_HISTORY"
    | "CUSTOMER_DAILY_LIMIT"
    | "BUSINESS_DAILY_LIMIT"
    | "SPAM_SUSPECTED"
    | "COOLDOWN_ACTIVE";
  cooldownSecondsRemaining?: number;
  customerOutgoingToday?: number;
  businessOutgoingToday?: number;
}

interface ConversationDetail {
  id: string;
  status: "open" | "closed" | "rate_limited";
  summary: string | null;
  lastIntent: string | null;
  customer: {
    id: string;
    name: string | null;
    phone: string;
    leadStatus: string;
    spamSuspected: boolean;
    spamReason: string | null;
    outgoingCountToday: number;
    lastOutgoingAt: string | null;
  };
  messages: Array<{
    id: string;
    direction: "incoming" | "outgoing";
    message: string;
    createdAt: string;
    fonnteInboxId: string | null;
  }>;
  sendGuard: SendGuard;
  safety: {
    inboundOnlyMode: boolean;
    replyCooldownSeconds: number;
    perCustomerDailyLimit: number;
    dailyMessageLimit: number;
    businessOutgoingToday: number;
    businessLimitReached: boolean;
  };
}

interface LoadOptions {
  background?: boolean;
}

const LIST_POLL_INTERVAL_MS = 7000;
const DETAIL_POLL_INTERVAL_MS = 3000;

export function InboxPageClient() {
  const [conversations, setConversations] = useState<ConversationCard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [search, setSearch] = useState("");
  const [leadStatus, setLeadStatus] = useState<string>("all");
  const [suggestedReply, setSuggestedReply] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const latestMessageAnchorRef = useRef<HTMLDivElement | null>(null);
  const latestMessageId = detail?.messages[detail.messages.length - 1]?.id ?? null;

  const listQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (leadStatus !== "all") params.set("leadStatus", leadStatus);
    return params.toString();
  }, [search, leadStatus]);

  const loadConversations = useCallback(async ({ background = false }: LoadOptions = {}) => {
    if (!background) {
      setLoadingConversations(true);
      setError(null);
    }

    try {
      const response = await fetch(`/api/conversations${listQuery ? `?${listQuery}` : ""}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal memuat inbox");
      }

      setConversations(data.data ?? []);

      if (!selectedId && data.data?.length) {
        setSelectedId(data.data[0].id);
      }

      if (selectedId && !(data.data ?? []).some((item: ConversationCard) => item.id === selectedId)) {
        setSelectedId(data.data?.[0]?.id ?? null);
      }
    } catch (loadError) {
      if (!background) {
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat inbox");
      }
    } finally {
      if (!background) {
        setLoadingConversations(false);
      }
    }
  }, [listQuery, selectedId]);

  const loadDetail = useCallback(
    async (conversationId: string, { background = false }: LoadOptions = {}) => {
      if (!background) {
        setLoadingDetail(true);
        setError(null);
      }

      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Gagal memuat detail conversation");
        }

        const nextDetail: ConversationDetail = {
          ...data.data,
          sendGuard: data.sendGuard,
          safety: data.safety,
        };

        if (selectedIdRef.current !== conversationId) {
          return;
        }

        setDetail(nextDetail);

        setSuggestedReply((currentReply) => {
          if (nextDetail.customer.spamSuspected || nextDetail.status === "rate_limited") {
            return "";
          }

          if (currentReply.trim()) {
            return currentReply;
          }

          return nextDetail.summary
            ? `Siap kak, aku catat ya: ${nextDetail.summary}`
            : "Halo kak, makasih udah chat. Lagi butuh produk apa biar aku bantu cek?";
        });
      } catch (loadError) {
        if (!background) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat detail conversation");
        }
      } finally {
        if (!background) {
          setLoadingDetail(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [loadDetail, selectedId]);

  useEffect(() => {
    if (!selectedId || detail?.sendGuard.code !== "COOLDOWN_ACTIVE") return;

    const timer = setTimeout(() => {
      void loadDetail(selectedId);
    }, 2000);

    return () => clearTimeout(timer);
  }, [detail?.sendGuard.code, loadDetail, selectedId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadConversations({ background: true });
    }, LIST_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadDetail(selectedId, { background: true });
    }, DETAIL_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadDetail, selectedId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      void loadConversations({ background: true });
      if (selectedId) {
        void loadDetail(selectedId, { background: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadConversations, loadDetail, selectedId]);

  useEffect(() => {
    if (!selectedId || !detail) return;

    const frame = window.requestAnimationFrame(() => {
      latestMessageAnchorRef.current?.scrollIntoView({
        block: "end",
        inline: "nearest",
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [detail, latestMessageId, selectedId]);

  const handleSendReply = async () => {
    if (!detail || !suggestedReply.trim()) return;

    setSubmitting(true);
    setWarning(null);
    setError(null);

    try {
      const inboxId =
        detail.messages
          .slice()
          .reverse()
          .find((item) => item.direction === "incoming" && item.fonnteInboxId)?.fonnteInboxId ?? undefined;

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: detail.customer.phone,
          message: suggestedReply.trim(),
          customerId: detail.customer.id,
          conversationId: detail.id,
          inboxId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Gagal mengirim pesan");
      }

      setWarning(data.warning ?? null);
      await loadDetail(detail.id);
      await loadConversations();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Gagal mengirim pesan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!detail) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: detail.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal generate ulang draft");
      }

      setSuggestedReply(data.analysis?.suggestedReply ?? "");
      await loadDetail(detail.id);
      await loadConversations();
    } catch (regenError) {
      setError(regenError instanceof Error ? regenError.message : "Gagal regenerate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFollowUp = async () => {
    if (!detail) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: detail.customer.id,
          conversationId: detail.id,
          message:
            suggestedReply.trim() ||
            "Follow-up pelanggan: cek kelanjutan kebutuhan dan konfirmasi ketersediaan.",
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal membuat follow-up");
      }

      setWarning("Follow-up berhasil dibuat.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Gagal membuat follow-up");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!detail) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: detail.customer.id,
          conversationId: detail.id,
          status: "draft",
          items: [],
          notes: detail.summary,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal membuat order draft");
      }

      setWarning("Order draft berhasil dibuat.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Gagal membuat order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearChat = async () => {
    if (!detail) return;

    const approved = window.confirm(
      "Hapus semua isi chat di conversation ini? Ringkasan AI akan direset.",
    );

    if (!approved) return;

    setClearingChat(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch(`/api/conversations/${detail.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menghapus isi chat");
      }

      setSuggestedReply("");
      setWarning(`Isi chat berhasil dihapus (${data.deletedMessages ?? 0} pesan).`);
      await loadDetail(detail.id);
      await loadConversations();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Gagal menghapus isi chat");
    } finally {
      setClearingChat(false);
    }
  };

  const sendBlocked = detail ? !detail.sendGuard.allowed : false;

  return (
    <div>
      <DashboardTopbar
        title="Inbox"
        description="Kelola chat WhatsApp, ringkasan AI, dan tindak lanjut penjualan dengan mitigasi anti-spam."
      />

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Terjadi kesalahan</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {warning ? (
        <Alert variant="warning" className="mb-4">
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ) : null}

      {detail?.safety.businessLimitReached ? (
        <Alert variant="warning" className="mb-4">
          <AlertTitle>Business daily message limit reached.</AlertTitle>
          <AlertDescription>
            Kuota harian bisnis sudah penuh. Pengiriman berikutnya akan tersedia besok.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="h-[calc(100vh-12rem)] overflow-hidden">
          <CardHeader className="space-y-3 pb-3">
            <CardTitle>Daftar Conversation</CardTitle>
            <div className="space-y-2">
              <Input
                placeholder="Cari nama atau nomor"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select value={leadStatus} onValueChange={setLeadStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter lead status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {LEAD_STATUS_VALUES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="h-[calc(100%-8.5rem)] p-0">
            <ScrollArea className="h-full">
              {loadingConversations ? (
                <p className="p-4 text-sm text-zinc-500">Memuat conversation...</p>
              ) : conversations.length === 0 ? (
                <p className="p-4 text-sm text-zinc-500">Belum ada conversation.</p>
              ) : (
                <div className="space-y-2 p-3">
                  {conversations.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedId === item.id
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900">
                          {item.customer.name || item.customer.phone}
                        </p>
                        <LeadStatusBadge status={item.customer.leadStatus} />
                      </div>
                      <div className="mb-1 flex flex-wrap gap-1">
                        {item.customer.spamSuspected ? (
                          <Badge className="bg-rose-100 text-rose-700">Spam Suspected</Badge>
                        ) : null}
                        {item.status === "rate_limited" ? (
                          <Badge className="bg-orange-100 text-orange-700">Rate Limited</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-zinc-600">{item.customer.phone}</p>
                      <p className="mt-2 text-xs text-zinc-700">
                        {truncate(item.lastMessage?.message || item.summary || "Belum ada pesan", 72)}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">{formatDateTime(item.lastMessageAt)}</p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="h-[calc(100vh-30rem)] min-h-72 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>
                  {detail ? detail.customer.name || detail.customer.phone : "Pilih conversation"}
                </CardTitle>
                {detail ? <LeadStatusBadge status={detail.customer.leadStatus} /> : null}
              </div>
              {detail ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {detail.safety.inboundOnlyMode ? (
                    <Badge className="bg-sky-100 text-sky-700">Inbound Only</Badge>
                  ) : null}
                  {detail.customer.spamSuspected ? (
                    <Badge className="bg-rose-100 text-rose-700">Spam Suspected</Badge>
                  ) : null}
                  {detail.status === "rate_limited" ? (
                    <Badge className="bg-orange-100 text-orange-700">Rate Limited</Badge>
                  ) : null}
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="h-[calc(100%-5rem)] p-0">
              {loadingDetail ? (
                <p className="p-4 text-sm text-zinc-500">Memuat pesan...</p>
              ) : !detail ? (
                <p className="p-4 text-sm text-zinc-500">Pilih conversation di panel kiri.</p>
              ) : (
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                    <p>
                      Outgoing hari ini: <span className="font-semibold">{detail.customer.outgoingCountToday}</span>
                      /{detail.safety.perCustomerDailyLimit}
                    </p>
                    <p>
                      Last outgoing: <span className="font-semibold">{formatDateTime(detail.customer.lastOutgoingAt)}</span>
                    </p>
                    <p>
                      Business quota hari ini: <span className="font-semibold">{detail.safety.businessOutgoingToday}</span>
                      /{detail.safety.dailyMessageLimit}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {detail.messages.map((message, index) => {
                      const isLatestMessage = index === detail.messages.length - 1;

                      return (
                      <div
                        key={message.id}
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          message.direction === "incoming"
                            ? "mr-auto bg-zinc-100 text-zinc-900"
                            : "ml-auto bg-emerald-600 text-white"
                        } ${isLatestMessage ? "mb-4" : ""}`}
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
                      );
                    })}
                    <div ref={latestMessageAnchorRef} className="h-1" />
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Summary & Draft Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Ringkasan</p>
                <p className="mt-1 text-sm text-zinc-800">{detail?.summary || "Belum ada summary AI."}</p>
                <p className="mt-1 text-xs text-zinc-600">Intent: {detail?.lastIntent || "-"}</p>
              </div>

              {detail?.sendGuard.reason ? (
                <Alert variant="warning">
                  <AlertTitle>Kirim dibatasi</AlertTitle>
                  <AlertDescription>{detail.sendGuard.reason}</AlertDescription>
                </Alert>
              ) : null}

              <Textarea
                value={suggestedReply}
                onChange={(event) => setSuggestedReply(event.target.value)}
                placeholder="Draft balasan AI akan muncul di sini"
                rows={5}
                disabled={Boolean(detail?.customer.spamSuspected || detail?.status === "rate_limited")}
              />

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Button
                  onClick={handleSendReply}
                  disabled={!detail || submitting || clearingChat || !suggestedReply.trim() || sendBlocked}
                >
                  Send Reply
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleRegenerate}
                  disabled={!detail || submitting || clearingChat}
                >
                  Regenerate Draft
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCreateFollowUp}
                  disabled={!detail || submitting || clearingChat}
                >
                  Create Follow Up
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCreateOrder}
                  disabled={!detail || submitting || clearingChat}
                >
                  Create Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearChat}
                  disabled={!detail || submitting || clearingChat}
                >
                  {clearingChat ? "Menghapus..." : "Hapus Isi Chat"}
                </Button>
              </div>

              <p className="text-xs text-amber-700">
                Pesan masuk via webhook diproses AI di background. Auto-reply aktif secara default dan bisa
                dimatikan dengan env `AUTO_REPLY_ENABLED=false`.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
