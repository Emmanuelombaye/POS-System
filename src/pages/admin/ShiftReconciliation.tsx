import { useState, useEffect, useMemo } from "react";
import { useAppStore, Shift, ProductId } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardCheck,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Package,
    Clock,
    User,
    ExternalLink,
    ChevronRight
} from "lucide-react";
import { formatDateTime, formatCurrency } from "@/utils/format";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabase";

export const ShiftReconciliation = () => {
    const {
        recentShifts,
        pendingAdditions,
        products,
        settings,
        fetchShifts,
        fetchPendingAdditions,
        approveStockAddition
    } = useAppStore();

    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
    const [shiftSnapshots, setShiftSnapshots] = useState<any[]>([]);
    const [loadingShift, setLoadingShift] = useState(false);

    useEffect(() => {
        fetchShifts();
        fetchPendingAdditions();
    }, [fetchShifts, fetchPendingAdditions]);

    const handleSelectShift = async (shiftId: string) => {
        setSelectedShiftId(shiftId);
        setLoadingShift(true);
        try {
            const { data, error } = await supabase
                .from('shift_stock_snapshots')
                .select('*, products(name)')
                .eq('shift_id', shiftId);

            if (error) throw error;
            setShiftSnapshots(data || []);
        } catch (err) {
            console.error("Error fetching shift snapshots:", err);
        } finally {
            setLoadingShift(false);
        }
    };

    const selectedShift = useMemo(() => {
        return recentShifts.find(s => s.id === selectedShiftId);
    }, [recentShifts, selectedShiftId]);

    return (
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-charcoal tracking-tight uppercase">Shift Reconciliation</h1>
                    <p className="text-sm text-gray-500 font-medium">Audit stock movements, approve additions, and analyze variances.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr,1.8fr] gap-8">

                {/* LEFT COLLUMN: Shifts & Pending Additions */}
                <div className="space-y-8">

                    {/* Pending Additions Card */}
                    <Card className="border-none shadow-premium rounded-[32px] overflow-hidden">
                        <CardHeader className="bg-brand-burgundy/5 p-6 border-b border-brand-burgundy/10">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.15em] text-brand-burgundy flex items-center justify-between">
                                <span>Pending Approvals</span>
                                <Badge className="bg-brand-burgundy text-white border-none rounded-lg">{pendingAdditions.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {pendingAdditions.length === 0 ? (
                                <div className="p-12 text-center space-y-3 opacity-40">
                                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">All deliveries cleared</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {pendingAdditions.map(addition => (
                                        <div key={addition.id} className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-black text-brand-charcoal uppercase tracking-tight">{addition.productName}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{addition.supplier} • {formatDateTime(addition.createdAt)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-brand-burgundy">+{addition.quantityKg}kg</div>
                                                </div>
                                            </div>

                                            {addition.notes && (
                                                <div className="p-3 bg-white rounded-xl border border-gray-100 italic text-[11px] text-gray-500">
                                                    {addition.notes}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-wider"
                                                    onClick={() => approveStockAddition(addition.id, 'APPROVED')}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 h-10 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-xl font-black text-[10px] uppercase tracking-wider"
                                                    onClick={() => approveStockAddition(addition.id, 'REJECTED')}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Shifts List */}
                    <Card className="border-none shadow-premium rounded-[32px] overflow-hidden">
                        <CardHeader className="p-6 border-b border-gray-50">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.15em] text-gray-400">Recent Shifts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50">
                                {recentShifts.map(shift => (
                                    <button
                                        key={shift.id}
                                        className={`w-full p-6 text-left flex items-center justify-between transition-all group ${selectedShiftId === shift.id ? 'bg-brand-charcoal text-white' : 'hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleSelectShift(shift.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${selectedShiftId === shift.id ? 'bg-white/10 text-brand-gold' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-burgundy/5 group-hover:text-brand-burgundy'
                                                }`}>
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className={`text-sm font-black uppercase tracking-tight ${selectedShiftId === shift.id ? 'text-white' : 'text-brand-charcoal'}`}>
                                                    {shift.cashierName}
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase tracking-wider ${selectedShiftId === shift.id ? 'text-white/50' : 'text-gray-400'}`}>
                                                    {formatDateTime(shift.openedAt)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge className={`rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-wider border-none ${shift.status === 'APPROVED'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : shift.status === 'PENDING_REVIEW'
                                                        ? 'bg-amber-500/10 text-amber-500'
                                                        : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {shift.status.replace('_', ' ')}
                                            </Badge>
                                            <ChevronRight className={`h-4 w-4 transition-transform ${selectedShiftId === shift.id ? 'translate-x-1 text-brand-gold' : 'text-gray-300 group-hover:translate-x-1'}`} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLLUMN: Shift Details & Analysis */}
                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {!selectedShiftId ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key="empty"
                                className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[40px] border-2 border-dashed border-gray-100"
                            >
                                <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
                                    <ClipboardCheck className="h-12 w-12" />
                                </div>
                                <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tight">Select a Shift for Audit</h3>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto mt-2">
                                    Choose a shift from the list to see detailed stock movements and variance analysis.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                key={selectedShiftId}
                                className="space-y-8"
                            >
                                {/* Shift Summary Card */}
                                <div className="bg-white rounded-[40px] shadow-premium overflow-hidden">
                                    <div className="bg-brand-charcoal p-8 text-white flex flex-col md:flex-row justify-between gap-6 overflow-hidden relative">
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-brand-gold">
                                                    <Clock className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black tracking-tight uppercase">Shift Breakdown</h2>
                                                    <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">
                                                        Session: {formatDateTime(selectedShift?.openedAt)} — {formatDateTime(selectedShift?.closedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Status</div>
                                                <Badge className={`rounded-xl px-4 py-1.5 font-black text-xs uppercase tracking-widest border-none ${selectedShift?.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                                    }`}>
                                                    {selectedShift?.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
                                    </div>

                                    <div className="p-0">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50/50">
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Product / Cut</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Opening</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Added</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Sold</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Expected</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Physical</th>
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Variance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {shiftSnapshots.map(snap => {
                                                    const isMajorVariance = Math.abs(snap.variance_kg || 0) > 0.5;
                                                    return (
                                                        <tr key={snap.id} className="hover:bg-gray-50/30 transition-colors group">
                                                            <td className="px-8 py-5">
                                                                <div className="text-sm font-black text-brand-charcoal uppercase tracking-tight">{snap.products?.name}</div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="text-sm font-bold text-gray-500">{snap.opening_kg.toFixed(2)}<span className="text-[10px] ml-1">kg</span></div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="text-sm font-bold text-emerald-600">
                                                                    {snap.expected_closing_kg !== null ? `+${(snap.expected_closing_kg - snap.opening_kg).toFixed(2)}` : '--'}
                                                                    <span className="text-[10px] ml-1">kg</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="text-sm font-bold text-red-500">
                                                                    {/* Ideally calculate from sales specific to this shift, for now placeholder */}
                                                                    -- <span className="text-[10px] ml-1">kg</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="text-sm font-black text-brand-charcoal">{snap.expected_closing_kg?.toFixed(2) || '--'}<span className="text-[10px] ml-1 opacity-40 font-bold">kg</span></div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="text-sm font-black text-brand-charcoal">{snap.actual_closing_kg?.toFixed(2) || '--'}<span className="text-[10px] ml-1 opacity-40 font-bold">kg</span></div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <div className={`text-sm font-black flex items-center justify-end gap-1.5 ${(snap.variance_kg || 0) < 0 ? 'text-brand-burgundy' : (snap.variance_kg || 0) > 0 ? 'text-emerald-500' : 'text-gray-300'
                                                                    }`}>
                                                                    {snap.variance_kg > 0 && <ArrowUpRight className="h-4 w-4" />}
                                                                    {snap.variance_kg < 0 && <ArrowDownRight className="h-4 w-4" />}
                                                                    {snap.variance_kg?.toFixed(2) || '0.00'}
                                                                    <span className="text-[10px] font-bold uppercase tracking-tighter">kg</span>
                                                                </div>
                                                                {isMajorVariance && (
                                                                    <div className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1">High Variance</div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row gap-6 items-center justify-between">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calculated By</span>
                                                <span className="text-xs font-bold text-brand-charcoal flex items-center gap-1.5 mt-1">
                                                    <User className="h-3.5 w-3.5 text-brand-gold" /> System Ledger
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 w-full md:w-auto">
                                            <Button variant="outline" className="flex-1 md:w-40 h-12 rounded-xl border-gray-200 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                                Flag Review
                                            </Button>
                                            <Button className="flex-1 md:w-60 h-12 rounded-xl bg-brand-charcoal hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-lg">
                                                Finalize & Approve Shift
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Legend or Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="border-none shadow-premium rounded-[24px] bg-white p-6 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-brand-burgundy/5 text-brand-burgundy flex items-center justify-center">
                                            <AlertTriangle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discrepancy items</div>
                                            <div className="text-xl font-black text-brand-charcoal">
                                                {shiftSnapshots.filter(s => Math.abs(s.variance_kg || 0) > 0.5).length}
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="border-none shadow-premium rounded-[24px] bg-white p-6 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/5 text-emerald-500 flex items-center justify-center">
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales Volume</div>
                                            <div className="text-xl font-black text-brand-charcoal">
                                                {/* Placeholder */}
                                                142.5 kg
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="border-none shadow-premium rounded-[24px] bg-white p-6 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-brand-gold/5 text-brand-gold flex items-center justify-center">
                                            <ExternalLink className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Audit Trail</div>
                                            <div className="text-xs font-black text-brand-gold uppercase tracking-[0.1em] mt-1 cursor-pointer hover:underline">
                                                View Full Ledger
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
