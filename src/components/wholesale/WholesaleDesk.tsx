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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">
          Wholesale / Market Sales
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Daily branch summary – cash & M-Pesa only
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-900/20 p-2 sm:p-3 text-xs sm:text-sm text-red-400 border border-red-700">
          Error: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center text-slate-400 py-6 sm:py-8 text-sm">
          Loading summaries...
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="space-y-4 sm:space-y-6">
          {/* 1. Add New Summary */}
          <WholesaleSummaryCard onSave={handleAddSummary} />

          {/* 2. View Recorded Summaries */}
          {summaries.length > 0 && (
            <WholesaleSummaryDisplay summaries={summaries} />
          )}

          {/* 3. Generate Report */}
          {summaries.length > 0 && (
            <TextReportGenerator summaries={summaries} />
          )}
        </div>
      )}
    </div>
  );
};
