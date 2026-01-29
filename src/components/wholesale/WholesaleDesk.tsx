import { useState, useEffect } from "react";
import { WholesaleSummaryCard, DailySummary } from "./WholesaleSummaryCard";
import { WholesaleSummaryDisplay } from "./WholesaleSummaryDisplay";
import { TextReportGenerator } from "./TextReportGenerator";

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

  // Fetch summaries on mount
  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/wholesale-summaries`);
      if (!response.ok) throw new Error("Failed to fetch summaries");
      const data = await response.json();
      setSummaries(data);
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
        body: JSON.stringify(summary),
      });
      if (!response.ok) throw new Error("Failed to save summary");
      const savedSummary = await response.json();
      setSummaries([savedSummary, ...summaries]);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error saving summary:", err);
      alert("Failed to save summary. Please try again.");
    }
  };

  return (
    <div className="space-y-6 px-6 py-8 max-w-[1200px] mx-auto bg-brand-offwhite min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-charcoal tracking-tight">
          Wholesale / Market Sales
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Daily branch summary – cash & M-Pesa only
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 shadow-sm">
          Error: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center text-gray-400 py-8 text-sm">
          Loading summaries...
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
