import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailySummary } from "./WholesaleSummaryCard";
import { FileText } from "lucide-react";

interface WholesaleSummaryDisplayProps {
  summaries: DailySummary[];
}

/**
 * Display wholesale summaries in human-readable text format
 * No tables - just clean, readable sentences grouped by branch
 */
export const WholesaleSummaryDisplay = ({
  summaries,
}: WholesaleSummaryDisplayProps) => {
  // Group summaries by branch and date
  const groupedByBranch = (
    Object.values({
      "Branch 1": [] as DailySummary[],
      "Branch 2": [] as DailySummary[],
      "Branch 3": [] as DailySummary[],
    }) as DailySummary[][]
  );

  const byBranch: Record<string, DailySummary[]> = {
    "Branch 1": [],
    "Branch 2": [],
    "Branch 3": [],
  };

  summaries.forEach((s) => {
    byBranch[s.branch].push(s);
  });

  if (summaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-brand-charcoal">
            Daily Summaries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400">
            No summaries recorded yet. Start by adding a daily entry above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-brand-charcoal flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-gold" />
          Daily Summaries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {Object.entries(byBranch).map(([branchName, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={branchName} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-burgundy"></div>
                <h3 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
                  {branchName}
                </h3>
              </div>
              <div className="space-y-3 pl-4 border-l-2 border-gray-100 ml-1">
                {items
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((summary) => {
                    const dateObj = new Date(summary.date);
                    const formattedDate = dateObj.toLocaleDateString("en-KE", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <div
                        key={summary.id}
                        className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-brand-burgundy/20 hover:bg-white transition-colors"
                      >
                        <div className="flex flex-col gap-2">
                          <span className="font-semibold text-brand-charcoal">
                            {formattedDate}
                          </span>
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="font-bold text-brand-burgundy">Total M-Pesa: KES {summary.mpesaReceived.toLocaleString()}</span>
                            <span className="w-px h-3 bg-gray-300 hidden sm:block"></span>
                            <span className="font-bold text-brand-burgundy">Total Cash: KES {summary.cashReceived.toLocaleString()}</span>
                          </div>
                          {(summary.transactionCash > 0 || summary.transactionMpesa > 0 || summary.manualCash > 0 || summary.manualMpesa > 0) && (
                            <div className="text-[10px] text-gray-400 flex items-center gap-4 flex-wrap mt-1 pl-2 border-l-2 border-brand-gold/30">
                              {summary.transactionCash > 0 && (
                                <span>From Sales (Cash): {summary.transactionCash.toLocaleString()}</span>
                              )}
                              {summary.transactionMpesa > 0 && (
                                <span>From Sales (M-Pesa): {summary.transactionMpesa.toLocaleString()}</span>
                              )}
                              {summary.manualCash > 0 && (
                                <span>Manual Entry (Cash): {summary.manualCash.toLocaleString()}</span>
                              )}
                              {summary.manualMpesa > 0 && (
                                <span>Manual Entry (M-Pesa): {summary.manualMpesa.toLocaleString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
