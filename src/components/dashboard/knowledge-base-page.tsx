"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
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
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_CATEGORY_LABEL } from "@/lib/setup";

type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  isActive: boolean;
}

interface KnowledgeFormState {
  id?: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  isActive: boolean;
}

const defaultForm: KnowledgeFormState = {
  title: "",
  category: "faq",
  content: "",
  isActive: true,
};

export function KnowledgeBasePageClient() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<KnowledgeFormState>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (categoryFilter !== "all") {
      params.set("category", categoryFilter);
    }
    if (search.trim()) {
      params.set("q", search.trim());
    }
    return params.toString();
  }, [categoryFilter, search]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/knowledge-base${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal memuat knowledge base");
      }

      setItems(data.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat knowledge base");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const openCreate = () => {
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item: KnowledgeItem) => {
    setForm({
      id: item.id,
      title: item.title,
      category: item.category,
      content: item.content,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(form.id ? `/api/knowledge-base/${form.id}` : "/api/knowledge-base", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          content: form.content,
          isActive: form.isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menyimpan knowledge");
      }

      setDialogOpen(false);
      setForm(defaultForm);
      setSuccess("Knowledge item berhasil disimpan.");
      await loadItems();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan knowledge");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/knowledge-base/${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menghapus knowledge");
      }

      setDeleteTarget(null);
      setSuccess("Knowledge item berhasil dihapus.");
      await loadItems();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus knowledge");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <DashboardTopbar
        title="Knowledge Base"
        description="Simpan informasi bisnis penting agar balasan AI lebih akurat dan tidak mengarang."
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
            <CardTitle>Daftar Knowledge</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Knowledge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{form.id ? "Edit Knowledge" : "Tambah Knowledge"}</DialogTitle>
                  <DialogDescription>Tambahkan informasi operasional penting untuk AI.</DialogDescription>
                </DialogHeader>
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input
                      required
                      value={form.title}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, category: value as KnowledgeCategory }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KNOWLEDGE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {KNOWLEDGE_CATEGORY_LABEL[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Konten</Label>
                    <Textarea
                      required
                      rows={5}
                      value={form.content}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, content: event.target.value }))
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                      }
                    />
                    Knowledge aktif
                  </label>
                  <DialogFooter>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_220px]">
            <Input
              placeholder="Cari judul atau konten"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {KNOWLEDGE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {KNOWLEDGE_CATEGORY_LABEL[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-500">Memuat knowledge base...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada knowledge item.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Konten</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{KNOWLEDGE_CATEGORY_LABEL[item.category]}</TableCell>
                    <TableCell className="max-w-[460px] truncate">{item.content}</TableCell>
                    <TableCell>{item.isActive ? "Aktif" : "Nonaktif"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmAlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus knowledge ini?"
        description={`Item "${deleteTarget?.title ?? ""}" akan dihapus permanen.`}
        confirmLabel={deletingId ? "Menghapus..." : "Ya, hapus"}
        loading={Boolean(deletingId)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
