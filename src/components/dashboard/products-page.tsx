"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/utils";

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  category: string | null;
  keywords: string[];
  imageUrl: string | null;
  isActive: boolean;
}

interface ProductFormState {
  id?: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  keywords: string;
  imageUrl: string;
  isActive: boolean;
}

const defaultForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  category: "",
  keywords: "",
  imageUrl: "",
  isActive: true,
};

export function ProductsPageClient() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(defaultForm);

  const query = useMemo(() => {
    if (!search.trim()) return "";
    const params = new URLSearchParams({ q: search.trim() });
    return params.toString();
  }, [search]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products${query ? `?${query}` : ""}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal memuat produk");
      }

      setProducts(data.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const openCreateDialog = () => {
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (product: ProductItem) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      stock: String(product.stock),
      category: product.category ?? "",
      keywords: product.keywords.join(", "),
      imageUrl: product.imageUrl ?? "",
      isActive: product.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category || null,
      keywords: form.keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      imageUrl: form.imageUrl || null,
      isActive: form.isActive,
    };

    try {
      const response = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menyimpan produk");
      }

      setDialogOpen(false);
      setForm(defaultForm);
      await loadProducts();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal simpan produk");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menghapus produk");
      }

      await loadProducts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus produk");
    }
  };

  return (
    <div>
      <DashboardTopbar
        title="Products"
        description="Kelola katalog produk untuk membantu AI membuat balasan sales akurat."
      />

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Daftar Produk</CardTitle>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{form.id ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
                  <DialogDescription>
                    Pastikan harga, stok, dan kata kunci akurat untuk rekomendasi AI.
                  </DialogDescription>
                </DialogHeader>

                <form className="space-y-3" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label>Nama Produk</Label>
                    <Input
                      required
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea
                      rows={3}
                      value={form.description}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Harga</Label>
                      <Input
                        required
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stok</Label>
                      <Input
                        required
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <Input
                        value={form.category}
                        onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Keywords (koma)</Label>
                      <Input
                        value={form.keywords}
                        onChange={(event) => setForm((prev) => ({ ...prev, keywords: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={form.imageUrl}
                      onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          isActive: event.target.checked,
                        }))
                      }
                    />
                    Produk aktif
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

          <Input
            placeholder="Cari nama/deskripsi/kategori"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-500">Memuat produk...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada produk.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-zinc-500">{product.description || "-"}</p>
                    </TableCell>
                    <TableCell>{formatRupiah(product.price)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>{product.keywords.join(", ") || "-"}</TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge className="bg-green-100 text-green-700">aktif</Badge>
                      ) : (
                        <Badge className="bg-zinc-200 text-zinc-600">nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
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
    </div>
  );
}
