"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Send, Plus } from "lucide-react";

import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { FOLLOW_UP_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

const FOLLOW_UP_STATUSES = ["pending", "sent", "cancelled"] as const;

interface FollowUpItem {
  id: string;
  customerId: string;
  conversationId: string | null;
  message: string;
  scheduledAt: string;
  status: (typeof FOLLOW_UP_STATUSES)[number];
  customer: {
    name: string | null;
    phone: string;
  };
}

interface CustomerOption {
  id: string;
  name: string | null;
  phone: string;
}

export function FollowUpsPageClient() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const query = useMemo(() => {
    if (statusFilter === "all") return "";
    return new URLSearchParams({ status: statusFilter }).toString();
  }, [statusFilter]);

  const loadFollowUps = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/follow-ups${query ? `?${query}` : ""}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal memuat follow-up");
      }

      setFollowUps(data.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat follow-up");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/customers", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) return;
      setCustomers(data.data ?? []);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    void loadFollowUps();
  }, [loadFollowUps]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const handleSendNow = async (item: FollowUpItem) => {
    setSendingId(item.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/follow-ups/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendNow: true }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal mengirim follow-up");
      }

      setSuccess("Follow-up berhasil dikirim manual.");
      await loadFollowUps();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Gagal kirim follow-up");
    } finally {
      setSendingId(null);
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          message,
          scheduledAt,
          status: "pending",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal membuat follow-up");
      }

      setSuccess("Follow-up berhasil dibuat.");
      setDialogOpen(false);
      setCustomerId("");
      setMessage("");
      setScheduledAt("");
      await loadFollowUps();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Gagal membuat follow-up");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <DashboardTopbar
        title="Follow Ups"
        description="Kelola reminder follow-up. Pengiriman tetap manual untuk menghindari spam."
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

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Daftar Follow-up</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Follow-up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Follow-up</DialogTitle>
                  <DialogDescription>
                    Reminder dibuat dulu, pengiriman WA dilakukan manual oleh admin.
                  </DialogDescription>
                </DialogHeader>

                <form className="space-y-3" onSubmit={handleCreate}>
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {(customer.name || "Tanpa Nama") + ` (${customer.phone})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pesan Follow-up</Label>
                    <Textarea
                      rows={4}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jadwal</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(event) => setScheduledAt(event.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={saving || !customerId}>
                      {saving ? "Menyimpan..." : "Simpan Follow-up"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-72">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              {FOLLOW_UP_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {FOLLOW_UP_STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-500">Memuat follow-up...</p>
          ) : followUps.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada follow-up.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Pesan</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUps.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.customer.name || "Tanpa Nama"}</p>
                      <p className="text-xs text-zinc-500">{item.customer.phone}</p>
                    </TableCell>
                    <TableCell>{item.message}</TableCell>
                    <TableCell>{formatDateTime(item.scheduledAt)}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700">{FOLLOW_UP_STATUS_LABEL[item.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendNow(item)}
                        disabled={item.status !== "pending" || sendingId === item.id}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {sendingId === item.id ? "Mengirim..." : "Send Manual"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="mt-3 text-xs text-amber-700">
        Reminder follow-up tetap manual. Admin wajib review lalu klik Send Manual untuk pengiriman terjadwal.
      </p>
    </div>
  );
}
