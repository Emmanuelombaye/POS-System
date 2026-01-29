import { useState } from "react";
import { useAppStore, Product } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";
import { Plus, Pencil, Trash2, X, Save, Search } from "lucide-react";

// Safe ID generator fallback
const safeId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

export const ProductManager = () => {
    const { products, addProduct, updateProduct, deleteProduct, currentUser, settings } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});

    // Ensure only admins can access this
    if (currentUser?.role !== "admin") return null;

    const filteredProducts = (products || []).filter(p =>
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (product: Product) => {
        setCurrentProduct({ ...product });
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentProduct({
            name: "",
            code: "",
            category: "beef",
            pricePerKg: 0,
            stockKg: 0,
            lowStockThresholdKg: 5,
            isActive: true,
        });
        setIsEditing(true);
    };

    const handleDelete = (id: string, name: string) => {
        if (!currentUser) return;
        if (window.confirm(`Are you sure you want to delete "${name}"? This will remove it from all menus immediately.`)) {
            deleteProduct(id, currentUser.id);
        }
    };

    const handleSave = () => {
        if (!currentUser) return;
        if (!currentProduct.name || !currentProduct.code || !currentProduct.pricePerKg) {
            alert("Please fill in all required fields.");
            return;
        }

        if (currentProduct.id) {
            updateProduct(currentProduct.id, currentProduct, currentUser.id);
        } else {
            const newProduct: Product = {
                id: safeId(),
                name: currentProduct.name,
                code: currentProduct.code,
                category: currentProduct.category as any,
                pricePerKg: Number(currentProduct.pricePerKg),
                stockKg: Number(currentProduct.stockKg) || 0,
                lowStockThresholdKg: Number(currentProduct.lowStockThresholdKg) || 0,
                isActive: currentProduct.isActive ?? true,
            };
            addProduct(newProduct, currentUser.id);
        }
        setIsEditing(false);
        setCurrentProduct({});
    };

    return (
        <Card className="border-none shadow-sm rounded-[20px] bg-white">
            <CardHeader className="pt-8 px-8 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold text-brand-charcoal">Product Catalog</CardTitle>
                    <p className="text-sm font-bold text-[hsl(var(--text-muted))] mt-1">Manage inventory items and pricing</p>
                </div>
                <Button onClick={handleAddNew} className="bg-brand-burgundy hover:bg-red-900 text-white rounded-xl font-bold px-6 h-12 shadow-lg shadow-brand-burgundy/20">
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </CardHeader>

            <CardContent className="px-8 pb-8">
                {/* Search */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-muted))]" />
                    <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-burgundy font-bold text-brand-charcoal placeholder:text-[hsl(var(--text-muted))]"
                    />
                </div>

                {/* List */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr className="text-left">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))]">Name</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))]">Category</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))] text-right">Price/Kg</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))] text-right">Stock</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-brand-charcoal">{p.name}</div>
                                        <div className="text-[10px] font-bold text-[hsl(var(--text-muted))] font-mono">{p.code}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className="uppercase text-[10px] font-bold border-gray-200 text-[hsl(var(--text-secondary))] px-2 py-0.5 h-auto">
                                            {p.category}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-brand-charcoal font-mono">
                                        {formatCurrency(p.pricePerKg, settings)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-bold ${p.stockKg <= p.lowStockThresholdKg ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {p.stockKg.toFixed(1)} kg
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-white border border-gray-100 shadow-sm rounded-lg">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.name)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border border-gray-100 shadow-sm rounded-lg">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            {/* Edit Modal (Overlay - Standard CSS) */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-white rounded-[24px] shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-brand-charcoal">
                                {currentProduct.id ? "Edit Product" : "New Product"}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-full h-8 w-8 hover:bg-gray-100 text-gray-400">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-2">Product Name</label>
                                    <Input
                                        value={currentProduct.name}
                                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        className="h-12 font-bold text-brand-charcoal"
                                        placeholder="e.g. Premium Steak"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-2">Code</label>
                                    <Input
                                        value={currentProduct.code}
                                        onChange={e => setCurrentProduct({ ...currentProduct, code: e.target.value.toUpperCase() })}
                                        className="h-12 font-bold font-mono text-brand-charcoal uppercase"
                                        placeholder="BF-STK"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-2">Category</label>
                                    <select
                                        value={currentProduct.category}
                                        onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value as any })}
                                        className="w-full h-12 rounded-lg border border-gray-200 px-3 text-sm font-bold text-brand-charcoal focus:border-brand-burgundy outline-none bg-white"
                                    >
                                        <option value="beef">Beef</option>
                                        <option value="goat">Goat</option>
                                        <option value="offal">Offal</option>
                                        <option value="processed">Processed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-2">Price / Kg</label>
                                    <Input
                                        type="number"
                                        value={currentProduct.pricePerKg}
                                        onChange={e => setCurrentProduct({ ...currentProduct, pricePerKg: Number(e.target.value) })}
                                        className="h-12 font-bold text-brand-charcoal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-2">Current Stock</label>
                                    <Input
                                        type="number"
                                        value={currentProduct.stockKg}
                                        onChange={e => setCurrentProduct({ ...currentProduct, stockKg: Number(e.target.value) })}
                                        className="h-12 font-bold text-brand-charcoal"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsEditing(false)} className="h-12 px-6 rounded-xl font-bold border-gray-200 text-[hsl(var(--text-secondary))]">
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} className="h-12 px-8 rounded-xl font-bold bg-brand-burgundy hover:bg-red-900 text-white shadow-lg shadow-brand-burgundy/20">
                                    <Save className="mr-2 h-4 w-4" /> Save Product
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};
