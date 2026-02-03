import { useState, useMemo, useEffect } from "react";
import { useAppStore, ProductId } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Lock, CheckCircle2, History, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/utils/format";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";

interface ShiftStockEntry {
    id: string;
    product_id: string;
    opening_stock: number;
    added_stock: number;
    sold_stock: number;
    closing_stock: number;
    variance: number;
    products: {
        name: string;
        category: string;
        code: string;
    };
}

export const ShiftStock = () => {
    const {
        currentUser,
        activeShift,
        currentBranch,
        products,
        recentShifts,
        openShift,
        closeShift,
        fetchShifts,
    } = useAppStore();

    const [isAddingStock, setIsAddingStock] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [quantityKg, setQuantityKg] = useState<number | "">("");
    const [supplier, setSupplier] = useState("");
    const [notes, setNotes] = useState("");
    const [batchNumber, setBatchNumber] = useState("");

    const [shiftEntries, setShiftEntries] = useState<ShiftStockEntry[]>([]);
    const [loadingShiftEntries, setLoadingShiftEntries] = useState(false);

    const [closingCounts, setClosingCounts] = useState<Record<ProductId, number>>({});
    const [isClosingShift, setIsClosingShift] = useState(false);

    useEffect(() => {
        fetchShifts();
    }, [fetchShifts]);

    const fetchShiftEntries = async () => {
        if (!activeShift) return;
        try {
            setLoadingShiftEntries(true);
            const data = await api.get(`/shift-stock?shift_id=${activeShift.id}`);
            setShiftEntries(data.entries || []);
        } catch (error) {
            console.error("Error fetching shift stock entries:", error);
        } finally {
            setLoadingShiftEntries(false);
        }
    };

    useEffect(() => {
        if (!activeShift) return;
        fetchShiftEntries();
        const interval = setInterval(fetchShiftEntries, 8000);
        return () => clearInterval(interval);
    }, [activeShift?.id]);

    const handleOpenShift = async () => {
        if (currentUser) {
            await openShift(currentUser.id, currentBranch);
        }
    };

    const handleAddStock = async () => {
        if (!activeShift || !selectedProductId || !quantityKg) return;

        await api.post("/shift/add-stock", {
            shift_id: activeShift.id,
            product_id: selectedProductId,
            quantity_kg: Number(quantityKg),
            supplier,
            notes,
            batch: batchNumber
        });
        await fetchShiftEntries();

        setIsAddingStock(false);
        setSelectedProductId("");
        setQuantityKg("");
        setSupplier("");
        setNotes("");
        setBatchNumber("");
    };

    const handleCloseShift = async () => {
        if (!activeShift) return;

        // Ensure all active products have a count (default to 0 if skipped)
        const finalCounts = { ...closingCounts };
        products.forEach(p => {
            if (p.isActive && finalCounts[p.id] === undefined) {
                finalCounts[p.id] = 0;
            }
        });

        await closeShift(activeShift.id, finalCounts);
        setIsClosingShift(false);
        setClosingCounts({});
    };

    const userShifts = useMemo(() => {
        return recentShifts.filter(s => s.cashierId === currentUser?.id);
    }, [recentShifts, currentUser]);

    if (!activeShift) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4 py-12">
                    <div className="h-20 w-20 bg-brand-burgundy/10 text-brand-burgundy rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-black text-brand-charcoal tracking-tight uppercase">Shift Not Started</h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        You need to open your shift before recording stock additions or processing sales.
                    </p>
                    <Button
                        size="lg"
                        className="mt-6 px-12 h-14 rounded-2xl bg-brand-burgundy hover:bg-red-900 font-black uppercase tracking-widest shadow-premium-xl transition-all active:scale-95"
                        onClick={handleOpenShift}
                    >
                        Open New Shift
                    </Button>
                </div>

                {userShifts.length > 0 && (
                    <Card className="border-none shadow-premium rounded-[24px] overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <History className="h-4 w-4" /> Recent Shift History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50">
                                {userShifts.slice(0, 5).map(s => (
                                    <div key={s.id} className="p-6 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                                        <div className="space-y-1">
                                            <div className="text-sm font-black text-brand-charcoal">
                                                {formatDateTime(s.openedAt)}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                {s.closedAt ? `Closed: ${formatDateTime(s.closedAt)}` : 'Duration in progress'}
                                            </div>
                                        </div>
                                        <Badge className={`rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-wider ${s.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                s.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {s.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 pb-32">
            {/* Shift Header Card */}
            <div className="bg-brand-charcoal rounded-[32px] p-8 text-white shadow-premium-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-emerald-500 text-white border-none rounded-lg px-3 flex items-center gap-1.5 animate-pulse">
                                <div className="h-1.5 w-1.5 rounded-full bg-white" /> ACTIVE SHIFT
                            </Badge>
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Started {formatDateTime(activeShift.openedAt)}</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter">Current Inventory Control</h1>
                    </div>
                    <Button
                        variant="outline"
                        className="h-14 px-8 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white hover:text-brand-charcoal font-black uppercase tracking-widest transition-all"
                        onClick={() => setIsClosingShift(true)}
                    >
                        <Lock className="h-4 w-4 mr-2" /> End Shift
                    </Button>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-burgundy/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Live Shift Stock Table */}
            <Card className="border-none shadow-premium rounded-[32px] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black text-brand-charcoal uppercase tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                            <Package className="h-6 w-6" />
                        </div>
                        Shift Stock Dashboard
                    </CardTitle>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Opening | Added | Sold | Current (Live)</p>
                </CardHeader>
                <CardContent className="p-0">
                    {loadingShiftEntries ? (
                        <div className="p-8 text-center text-gray-400 font-semibold">Loading live stock...</div>
                    ) : shiftEntries.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 font-semibold">No shift stock entries yet</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</th>
                                        <th className="text-right py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Opening</th>
                                        <th className="text-right py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Added</th>
                                        <th className="text-right py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Sold</th>
                                        <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Current</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shiftEntries.map((entry) => (
                                        <tr key={entry.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/40 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="font-black text-brand-charcoal uppercase tracking-tight truncate">
                                                    {entry.products?.name}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    {entry.products?.category}
                                                </div>
                                            </td>
                                            <td className="text-right py-4 px-4 font-bold text-gray-700">{Number(entry.opening_stock || 0).toFixed(1)}kg</td>
                                            <td className="text-right py-4 px-4 font-bold text-emerald-600">+{Number(entry.added_stock || 0).toFixed(1)}kg</td>
                                            <td className="text-right py-4 px-4 font-bold text-red-500">-{Number(entry.sold_stock || 0).toFixed(1)}kg</td>
                                            <td className="text-right py-4 px-6 font-black text-brand-burgundy">{Number(entry.closing_stock || 0).toFixed(1)}kg</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Record Addition Section */}
                <Card className="border-none shadow-premium rounded-[32px] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black text-brand-charcoal uppercase tracking-tight flex items-center gap-3">
                            <div className="p-3 bg-brand-burgundy/5 rounded-2xl text-brand-burgundy">
                                <Plus className="h-6 w-6" />
                            </div>
                            Record Mid-Shift delivery
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Select Item</label>
                                <select
                                    className="w-full h-14 rounded-2xl border-2 border-gray-50 bg-gray-50/50 px-6 text-sm font-black text-brand-charcoal focus:border-brand-burgundy outline-none transition-all"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">Choose item...</option>
                                    {products.filter(p => p.isActive).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Quantity (kg)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="h-14 rounded-2xl bg-gray-50/50 border-2 border-transparent focus:border-brand-burgundy text-lg font-black"
                                        value={quantityKg}
                                        onChange={(e) => setQuantityKg(e.target.value ? Number(e.target.value) : "")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Supplier</label>
                                    <Input
                                        placeholder="e.g. Slaughterhouse"
                                        className="h-14 rounded-2xl bg-gray-50/50 border-2 border-transparent focus:border-brand-burgundy font-bold"
                                        value={supplier}
                                        onChange={(e) => setSupplier(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Batch / Lot (Optional)</label>
                                <Input
                                    placeholder="e.g. Batch #A32"
                                    className="h-14 rounded-2xl bg-gray-50/50 border-2 border-transparent focus:border-brand-burgundy font-bold"
                                    value={batchNumber}
                                    onChange={(e) => setBatchNumber(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Internal Notes</label>
                                <Input
                                    placeholder="Optional details..."
                                    className="h-14 rounded-2xl bg-gray-50/50 border-2 border-transparent focus:border-brand-burgundy font-medium"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full h-16 rounded-2xl bg-brand-burgundy hover:bg-red-900 font-black uppercase tracking-widest shadow-premium-xl transition-all disabled:opacity-50"
                            disabled={!selectedProductId || !quantityKg}
                            onClick={handleAddStock}
                        >
                            Declare Delivery
                        </Button>
                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                            Declaring stock updates your shift stock in real-time
                        </p>
                    </CardContent>
                </Card>

                {/* Current Sales Status or Info */}
                <div className="space-y-8">
                    <Card className="border-none shadow-premium rounded-[32px] bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-brand-charcoal uppercase tracking-tight flex items-center gap-3">
                                <div className="p-3 bg-brand-charcoal/5 rounded-2xl text-brand-charcoal">
                                    <Package className="h-6 w-6" />
                                </div>
                                Shift Stock Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            {loadingShiftEntries ? (
                                <div className="text-center py-6 text-gray-500">Loading stock data...</div>
                            ) : shiftEntries.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 font-black text-gray-600 uppercase tracking-widest text-[10px]">Product</th>
                                                <th className="text-right py-3 px-2 font-black text-gray-600 uppercase tracking-widest text-[10px]">Opening</th>
                                                <th className="text-right py-3 px-2 font-black text-gray-600 uppercase tracking-widest text-[10px]">+Added</th>
                                                <th className="text-right py-3 px-2 font-black text-gray-600 uppercase tracking-widest text-[10px]">-Sold</th>
                                                <th className="text-right py-3 px-2 font-black text-gray-600 uppercase tracking-widest text-[10px]">Current</th>
                                                <th className="text-center py-3 px-2 font-black text-gray-600 uppercase tracking-widest text-[10px]">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shiftEntries.map((entry) => (
                                                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                    <td className="py-3 font-semibold text-brand-charcoal">{entry.products.name}</td>
                                                    <td className="text-right py-3 px-2 text-brand-charcoal">{Number(entry.opening_stock || 0).toFixed(1)}kg</td>
                                                    <td className="text-right py-3 px-2 text-green-600 font-semibold">+{Number(entry.added_stock || 0).toFixed(1)}</td>
                                                    <td className="text-right py-3 px-2 text-red-600 font-semibold">-{Number(entry.sold_stock || 0).toFixed(1)}</td>
                                                    <td className="text-right py-3 px-2 text-brand-burgundy font-black">{Number(entry.closing_stock || 0).toFixed(1)}kg</td>
                                                    <td className="text-center py-3 px-2">
                                                        {Number(entry.variance || 0) !== 0 && Math.abs(Number(entry.variance || 0)) > 0.1 ? (
                                                            <span className="inline-block text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">⚠️ {Number(entry.variance || 0) > 0 ? '+' : ''}{Number(entry.variance || 0).toFixed(1)}</span>
                                                        ) : (
                                                            <span className="inline-block text-xs font-bold text-green-600">✓</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">No stock recorded for this shift yet</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-premium rounded-[32px] bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-brand-charcoal uppercase tracking-tight flex items-center gap-3">
                                <div className="p-3 bg-brand-charcoal/5 rounded-2xl text-brand-charcoal">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                Shift Rules & Guidance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="space-y-4">
                                {[
                                    { icon: CheckCircle2, text: "Record every meat delivery immediately upon arrival", color: "text-emerald-500" },
                                    { icon: AlertCircle, text: "Stock additions update your shift ledger in real-time", color: "text-amber-500" },
                                    { icon: CheckCircle2, text: "Sales automatically deduct from your current stock", color: "text-emerald-500" },
                                    { icon: AlertCircle, text: "Variance is auto-calculated at shift close", color: "text-brand-burgundy" },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50">
                                        <item.icon className={`h-5 w-5 mt-0.5 ${item.color}`} />
                                        <p className="text-sm font-bold text-gray-600 line-height-tight">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* CLosing Shift Drawer/Modal Overlay */}
            <AnimatePresence>
                {isClosingShift && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-brand-charcoal/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                        onClick={() => setIsClosingShift(false)}
                    >
                        <motion.div
                            initial={{ y: 100, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 100, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-[32px] shadow-premium-xl overflow-hidden p-8 space-y-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-brand-charcoal tracking-tighter uppercase">Close Shift Reconciliation</h2>
                                <p className="text-gray-500 font-medium">Enter the actual physical weight remaining for each tracked item.</p>
                            </div>

                            <div className="max-h-[40vh] overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                                {products.filter(p => p.isActive).map(p => (
                                    <div key={p.id} className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-burgundy/20 transition-all">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black text-brand-charcoal uppercase tracking-tight truncate">{p.name}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.category}</div>
                                        </div>
                                        <div className="relative w-32">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="h-12 rounded-xl bg-white border-2 border-transparent focus:border-brand-burgundy font-black text-right pr-10"
                                                value={closingCounts[p.id] ?? ""}
                                                onChange={(e) => setClosingCounts({ ...closingCounts, [p.id]: Number(e.target.value) })}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">kg</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <Button
                                    variant="ghost"
                                    className="h-16 flex-1 text-gray-400 font-black uppercase tracking-widest rounded-2xl"
                                    onClick={() => setIsClosingShift(false)}
                                >
                                    Go Back
                                </Button>
                                <Button
                                    className="h-16 flex-[1.5] bg-brand-charcoal hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-premium-xl transition-all active:scale-95"
                                    onClick={handleCloseShift}
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-3" /> Confirm & Close
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
