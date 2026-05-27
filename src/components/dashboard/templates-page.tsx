"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ReplyTemplateType } from "@prisma/client";

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
import { REPLY_TEMPLATE_TYPE_LABEL, REPLY_TEMPLATE_TYPES } from "@/lib/setup";

interface TemplateItem {
  id: string;
  type: ReplyTemplateType;
  title: string;
  content: string;
  isActive: boolean;
}

interface TemplateFormState {
  id?: string;
  type: ReplyTemplateType;
  title: string;
  content: string;
  isActive: boolean;
}

const defaultForm: TemplateFormState = {
  type: "greeting",
  title: "",
  content: "",
  isActive: true,
};

export function TemplatesPageClient() {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TemplateFormState>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/templates", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal memuat template");
      }

      setItems(data.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat template");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const openCreate = () => {
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item: TemplateItem) => {
    setForm({
      id: item.id,
      type: item.type,
      title: item.title,
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
      const response = await fetch(form.id ? `/api/templates/${form.id}` : "/api/templates", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          content: form.content,
          isActive: form.isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menyimpan template");
      }

      setSuccess("Template balasan berhasil disimpan.");
      setDialogOpen(false);
      setForm(defaultForm);
      await loadTemplates();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan template");
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
      const response = await fetch(`/api/templates/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menghapus template");
      }

      setDeleteTarget(null);
      setSuccess("Template berhasil dihapus.");
      await loadTemplates();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus template");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <DashboardTopbar
        title="Template Balasan"
        description="Kelola template respons agar AI memberi draft yang konsisten dengan gaya bisnis."
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
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Daftar Template</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{form.id ? "Edit Template" : "Tambah Template"}</DialogTitle>
                  <DialogDescription>
                    Gunakan format natural bahasa Indonesia agar cocok dipakai oleh AI.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <Select
                      value={form.type}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, type: value as ReplyTemplateType }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REPLY_TEMPLATE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {REPLY_TEMPLATE_TYPE_LABEL[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Label>Isi Template</Label>
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
                    Template aktif
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-500">Memuat template...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada template balasan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Isi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{REPLY_TEMPLATE_TYPE_LABEL[item.type]}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell className="max-w-[420px] truncate">{item.content}</TableCell>
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
        title="Hapus template ini?"
        description={`Template "${deleteTarget?.title ?? ""}" akan dihapus permanen.`}
        confirmLabel={deletingId ? "Menghapus..." : "Ya, hapus"}
        loading={Boolean(deletingId)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
