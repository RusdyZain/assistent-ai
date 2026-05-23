"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { LeadStatusBadge } from "@/components/dashboard/lead-status-badge";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { LEAD_STATUS_VALUES } from "@/types/sales";

interface CustomerItem {
  id: string;
  name: string | null;
  phone: string;
  leadStatus: string;
  tags: string[];
  lastMessageAt: string | null;
}

export function CustomersPageClient() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState("");
  const [leadStatus, setLeadStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (leadStatus !== "all") params.set("leadStatus", leadStatus);
    return params.toString();
  }, [leadStatus, search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/customers${query ? `?${query}` : ""}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Gagal memuat customer");
        }

        setCustomers(data.data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat customer");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [query]);

  return (
    <div>
      <DashboardTopbar
        title="Customers"
        description="Lihat lead status, histori interaksi, dan segmentasi pelanggan."
      />

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Daftar Customer</CardTitle>
          <div className="grid gap-2 md:grid-cols-3">
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
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-500">Memuat data customer...</p>
          ) : customers.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada customer.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Lead Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name || "-"}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <LeadStatusBadge status={customer.leadStatus} />
                    </TableCell>
                    <TableCell>{customer.tags.join(", ") || "-"}</TableCell>
                    <TableCell>{formatDateTime(customer.lastMessageAt)}</TableCell>
                    <TableCell>
                      <Link
                        className="text-sm font-medium text-zinc-900 underline"
                        href={`/dashboard/customers/${customer.id}`}
                      >
                        Lihat
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
