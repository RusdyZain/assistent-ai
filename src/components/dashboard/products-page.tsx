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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/utils";

type ProductType = "product" | "service";

interface ProductItem {
  id: string;
  name: string;
  type: ProductType;
  description: string | null;
  price: string;
  promoPrice: string | null;
  benefits: string | null;
  suitableFor: string | null;
  stock: number;
  stockStatus: string | null;
  availability: string | null;
  duration: string | null;
  minimumOrder: number | null;
  processingTime: string | null;
  deliveryInfo: string | null;
  category: string | null;
  keywords: string[];
  faq: unknown;
  imageUrl: string | null;
  tags: string[];
  isActive: boolean;
}

interface ProductFormState {
  id?: string;
  name: string;
  type: ProductType;
  description: string;
  price: string;
  promoPrice: string;
  benefits: string;
  suitableFor: string;
  stock: string;
  stockStatus: string;
  availability: string;
  duration: string;
  minimumOrder: string;
  processingTime: string;
  deliveryInfo: string;
  category: string;
  keywords: string;
  faq: string;
  imageUrl: string;
  tags: string;
  isActive: boolean;
}

const defaultForm: ProductFormState = {
  name: "",
  type: "product",
  description: "",
  price: "",
  promoPrice: "",
  benefits: "",
  suitableFor: "",
  stock: "0",
  stockStatus: "",
  availability: "",
  duration: "",
  minimumOrder: "",
  processingTime: "",
  deliveryInfo: "",
  category: "",
  keywords: "",
  faq: "",
  imageUrl: "",
  tags: "",
  isActive: true,
};

function parseFaqInput(rawFaq: string) {
  if (!rawFaq.trim()) return null;

  try {
    return JSON.parse(rawFaq);
  } catch {
    return rawFaq.trim();
  }
}

function formatFaqForForm(faq: unknown) {
  if (!faq) return "";
  if (typeof faq === "string") return faq;
  return JSON.stringify(faq, null, 2);
}

export function ProductsPageClient() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

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
      type: product.type,
      description: product.description ?? "",
      price: String(product.price),
      promoPrice: product.promoPrice ? String(product.promoPrice) : "",
      benefits: product.benefits ?? "",
      suitableFor: product.suitableFor ?? "",
      stock: String(product.stock),
      stockStatus: product.stockStatus ?? "",
      availability: product.availability ?? "",
      duration: product.duration ?? "",
      minimumOrder: product.minimumOrder !== null ? String(product.minimumOrder) : "",
      processingTime: product.processingTime ?? "",
      deliveryInfo: product.deliveryInfo ?? "",
      category: product.category ?? "",
      keywords: product.keywords.join(", "),
      faq: formatFaqForForm(product.faq),
      imageUrl: product.imageUrl ?? "",
      tags: product.tags.join(", "),
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
      type: form.type,
      description: form.description || null,
      price: Number(form.price),
      promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
      benefits: form.benefits || null,
      suitableFor: form.suitableFor || null,
      stock: Number(form.stock),
      stockStatus: form.stockStatus || null,
      availability: form.availability || null,
      duration: form.duration || null,
      minimumOrder: form.minimumOrder ? Number(form.minimumOrder) : null,
      processingTime: form.processingTime || null,
      deliveryInfo: form.deliveryInfo || null,
      category: form.category || null,
      keywords: form.keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      faq: parseFaqInput(form.faq),
      imageUrl: form.imageUrl || null,
      tags: form.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
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

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingProductId(deleteTarget.id);
    setError(null);

    try {
      const response = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menghapus produk");
      }

      setDeleteTarget(null);
      await loadProducts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus produk");
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <div>
      <DashboardTopbar
        title="Products"
        description="Kelola katalog produk/layanan untuk membantu AI membuat balasan sales akurat."
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
            <CardTitle>Daftar Produk / Layanan</CardTitle>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{form.id ? "Edit Produk / Layanan" : "Tambah Produk / Layanan"}</DialogTitle>
                  <DialogDescription>
                    Lengkapi informasi agar AI tidak mengarang harga, stok, atau kebijakan layanan.
                  </DialogDescription>
                </DialogHeader>

                <form className="space-y-3" onSubmit={handleSubmit}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <Input
                        required
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipe</Label>
                      <select
                        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                        value={form.type}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, type: event.target.value as ProductType }))
                        }
                      >
                        <option value="product">Product</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
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
                      <Label>Harga Promo</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.promoPrice}
                        onChange={(event) => setForm((prev) => ({ ...prev, promoPrice: event.target.value }))}
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
                      <Label>Tags (koma)</Label>
                      <Input
                        value={form.tags}
                        onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Stok</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status Stok</Label>
                      <Input
                        value={form.stockStatus}
                        onChange={(event) => setForm((prev) => ({ ...prev, stockStatus: event.target.value }))}
                        placeholder="in_stock / out_of_stock / preorder"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Availability</Label>
                      <Input
                        value={form.availability}
                        onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.value }))}
                        placeholder="Setiap hari, by appointment, dll."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Durasi</Label>
                      <Input
                        value={form.duration}
                        onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
                        placeholder="Contoh: 90 menit"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Minimum Order</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.minimumOrder}
                        onChange={(event) => setForm((prev) => ({ ...prev, minimumOrder: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Processing Time</Label>
                      <Input
                        value={form.processingTime}
                        onChange={(event) => setForm((prev) => ({ ...prev, processingTime: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Info</Label>
                    <Textarea
                      rows={2}
                      value={form.deliveryInfo}
                      onChange={(event) => setForm((prev) => ({ ...prev, deliveryInfo: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Benefits</Label>
                    <Textarea
                      rows={2}
                      value={form.benefits}
                      onChange={(event) => setForm((prev) => ({ ...prev, benefits: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Suitable For</Label>
                    <Textarea
                      rows={2}
                      value={form.suitableFor}
                      onChange={(event) => setForm((prev) => ({ ...prev, suitableFor: event.target.value }))}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Keywords (koma)</Label>
                      <Input
                        value={form.keywords}
                        onChange={(event) => setForm((prev) => ({ ...prev, keywords: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input
                        value={form.imageUrl}
                        onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>FAQ (teks atau JSON)</Label>
                    <Textarea
                      rows={3}
                      value={form.faq}
                      onChange={(event) => setForm((prev) => ({ ...prev, faq: event.target.value }))}
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
                    Item aktif
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
            placeholder="Cari nama/deskripsi/kategori/tag"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-500">Memuat produk...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada produk atau layanan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Kategori</TableHead>
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
                    <TableCell>{product.type}</TableCell>
                    <TableCell>
                      {formatRupiah(product.price)}
                      {product.promoPrice ? (
                        <p className="text-xs text-emerald-700">Promo: {formatRupiah(product.promoPrice)}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {product.stock}
                      {product.stockStatus ? (
                        <p className="text-xs text-zinc-500">{product.stockStatus}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button aria-label="Edit item" variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          aria-label="Hapus item"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(product)}
                        >
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
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Hapus item ini?"
        description={`Item "${deleteTarget?.name ?? ""}" akan dihapus permanen.`}
        confirmLabel={deletingProductId ? "Menghapus..." : "Ya, hapus"}
        loading={Boolean(deletingProductId)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
