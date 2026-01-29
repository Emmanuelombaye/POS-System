import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Printer } from "lucide-react";
import { DailySummary } from "./WholesaleSummaryCard";

interface TextReportGeneratorProps {
  summaries: DailySummary[];
}

/**
 * Generate and display plain-text report
 * Allows copy to clipboard and print-friendly layout
 */
export const TextReportGenerator = ({
  summaries,
}: TextReportGeneratorProps) => {
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (summaries.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg text-slate-50">
            Generate Text Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400">
            Add daily summaries first to generate a report.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Generate report text
  const generateReportText = () => {
    const today = new Date();
    const reportDate = today.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Group by branch
    const byBranch: Record<string, DailySummary[]> = {
      "Branch 1": [],
      "Branch 2": [],
      "Branch 3": [],
    };

    summaries.forEach((s) => {
      byBranch[s.branch].push(s);
    });

    const sentences: string[] = [];
    sentences.push(
      `Wholesale Business Report – ${reportDate}.`
    );

    Object.entries(byBranch).forEach(([branchName, items]) => {
      if (items.length === 0) return;

      // For each entry in this branch
      items
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .forEach((summary) => {
          const dateObj = new Date(summary.date);
          const dateStr = dateObj.toLocaleDateString("en-KE", {
            month: "short",
            day: "numeric",
          });

          sentences.push(
            `${branchName} (${dateStr}) recorded M-Pesa sales of KES ${summary.mpesaReceived.toLocaleString()} and cash sales of KES ${summary.cashReceived.toLocaleString()}.`
          );
        });
    });

    return sentences.join(" ");
  };

  const reportText = generateReportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (reportRef.current) {
      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write(
          "<html><head><title>Wholesale Report</title>"
        );
        printWindow.document.write(
          "<style>body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.8; }</style>"
        );
        printWindow.document.write("</head><body>");
        printWindow.document.write(reportRef.current.innerText);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg text-slate-50">
          Generate Text Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Display */}
        <div
          ref={reportRef}
          className="rounded-md border border-slate-700 bg-slate-950 p-4"
        >
          <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
            {reportText}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        <p className="text-xs text-slate-400">
          Use these actions to share or archive your wholesale reports.
        </p>
      </CardContent>
    </Card>
  );
};
