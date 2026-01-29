import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailySummary } from "./WholesaleSummaryCard";

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
      <Card className="border-slate-700 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg text-slate-50">
            Daily Summaries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400">
            No summaries recorded yet. Start by adding a daily entry above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg text-slate-50">
          Daily Summaries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(byBranch).map(([branchName, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={branchName} className="space-y-2 border-b border-slate-700 pb-4 last:border-b-0">
              <h3 className="text-sm font-semibold text-emerald-400">
                {branchName}
              </h3>
              <div className="space-y-1">
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
                      <p
                        key={summary.id}
                        className="text-xs text-slate-300 leading-relaxed"
                      >
                        <span className="font-medium text-slate-200">
                          {formattedDate}
                        </span>
                        : M-Pesa KES{" "}
                        <span className="font-semibold text-blue-400">
                          {summary.mpesaReceived.toLocaleString()}
                        </span>{" "}
                        | Cash KES{" "}
                        <span className="font-semibold text-green-400">
                          {summary.cashReceived.toLocaleString()}
                        </span>
                      </p>
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
