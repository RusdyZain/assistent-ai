"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";

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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime, formatRupiah } from "@/lib/utils";

const ORDER_STATUSES = [
  "draft",
  "confirmed",
  "waiting_payment",
  "paid",
  "cancelled",
  "completed",
] as const;

interface OrderItem {
  id: string;
  status: (typeof ORDER_STATUSES)[number];
  items: unknown;
  totalEstimate: string | null;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string | null;
    phone: string;
  };
}

interface OrderFormState {
  id: string;
  status: (typeof ORDER_STATUSES)[number];
  itemsText: string;
  totalEstimate: string;
  notes: string;
}

export function OrdersPageClient() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<OrderFormState | null>(null);

  const query = useMemo(() => {
    if (statusFilter === "all") return "";
    return new URLSearchParams({ status: statusFilter }).toString();
  }, [statusFilter]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders${query ? `?${query}` : ""}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal memuat order");
      }

      setOrders(data.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat order");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const openEdit = (order: OrderItem) => {
    setForm({
      id: order.id,
      status: order.status,
      itemsText: JSON.stringify(order.items, null, 2),
      totalEstimate: order.totalEstimate ?? "",
      notes: order.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;

    setSaving(true);
    setError(null);

    let parsedItems: unknown;

    try {
      parsedItems = JSON.parse(form.itemsText || "[]");
    } catch {
      setError("Format JSON items tidak valid");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/orders/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          items: parsedItems,
          totalEstimate: form.totalEstimate ? Number(form.totalEstimate) : null,
          notes: form.notes || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal update order");
      }

      setDialogOpen(false);
      setForm(null);
      await loadOrders();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <DashboardTopbar
        title="Orders"
        description="Review draft order dari percakapan WhatsApp dan update status transaksi."
      />

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Daftar Orders</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-72">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_LABEL[status] ?? status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-500">Memuat order...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada order.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Estimasi</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-medium">{order.customer.name || "Tanpa Nama"}</p>
                      <p className="text-xs text-zinc-500">{order.customer.phone}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700">{ORDER_STATUS_LABEL[order.status]}</Badge>
                    </TableCell>
                    <TableCell>{formatRupiah(order.totalEstimate)}</TableCell>
                    <TableCell>{order.notes || "-"}</TableCell>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>
                      <Button aria-label="Edit order" variant="ghost" size="icon" onClick={() => openEdit(order)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update status order, estimasi total, dan item yang berasal dari percakapan.
            </DialogDescription>
          </DialogHeader>

          {form ? (
            <form className="space-y-3" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => (prev ? { ...prev, status: value as OrderFormState["status"] } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {ORDER_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Items (JSON)</Label>
                <Textarea
                  rows={8}
                  value={form.itemsText}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, itemsText: event.target.value } : prev))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Total Estimasi</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.totalEstimate}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, totalEstimate: event.target.value } : prev))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, notes: event.target.value } : prev))}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
