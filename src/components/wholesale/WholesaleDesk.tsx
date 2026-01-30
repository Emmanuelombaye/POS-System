import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { WholesaleSummaryCard, DailySummary } from "./WholesaleSummaryCard";
import { WholesaleSummaryDisplay } from "./WholesaleSummaryDisplay";
import { TextReportGenerator } from "./TextReportGenerator";
import { supabase } from "@/utils/supabase";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Main Wholesale Desk page
 * Manages daily wholesale summaries for market/wholesale sales
 * Allows entry, display, and reporting of cash & M-Pesa sales by branch
 */
export const WholesaleDesk = () => {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch summaries on mount and subscribe to changes
  useEffect(() => {
    fetchSummaries();

    const channel = supabase
      .channel("wholesale-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "wholesale_summaries" }, () => {
        fetchSummaries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/wholesale-summaries`);
      if (!response.ok) throw new Error("Failed to fetch summaries");
      const data = await response.json();
      const mappedData = data.map((s: any) => ({
        id: s.id,
        date: s.date,
        branch: s.branch,
        cashReceived: s.cash_received,
        mpesaReceived: s.mpesa_received,
      }));
      setSummaries(mappedData);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching summaries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSummary = async (summary: DailySummary) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wholesale-summaries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: summary.id,
          date: summary.date,
          branch: summary.branch,
          cash_received: summary.cashReceived,
          mpesa_received: summary.mpesaReceived,
        }),
      });
      if (!response.ok) throw new Error("Failed to save summary");
      const savedSummaryRaw = await response.json();
      const savedSummary = {
        id: savedSummaryRaw.id,
        date: savedSummaryRaw.date,
        branch: savedSummaryRaw.branch,
        cashReceived: savedSummaryRaw.cash_received,
        mpesaReceived: savedSummaryRaw.mpesa_received,
      };
      setSummaries([savedSummary, ...summaries]);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error saving summary:", err);
      alert("Failed to save summary. Please try again.");
    }
  };

  return (
    <div className="space-y-8 px-4 lg:px-8 py-6 lg:py-8 max-w-[1200px] mx-auto bg-brand-offwhite min-h-screen slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-brand-charcoal tracking-tighter">
            Wholesale / Market
          </h1>
          <p className="mt-1 text-sm lg:text-base text-gray-500 font-medium">
            Daily branch summary & reporting
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-premium border border-gray-100">
          <Link to="/admin">
            <Button variant="outline" className="rounded-xl border-none shadow-none hover:bg-gray-50 font-black text-[10px] uppercase tracking-widest px-4 gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Main Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 shadow-sm">
          Error: {error}
        </div>
      )}

      {/* Loading state - Premium Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 skeleton-shimmer" />
          ))}
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-8">
          <div className="space-y-6">
            {/* 1. Add New Summary */}
            <WholesaleSummaryCard onSave={handleAddSummary} />

            {/* 3. Generate Report */}
            {summaries.length > 0 && (
              <TextReportGenerator summaries={summaries} />
            )}
          </div>

          {/* 2. View Recorded Summaries */}
          <div>
            {summaries.length > 0 ? (
              <WholesaleSummaryDisplay summaries={summaries} />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                No summaries recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
