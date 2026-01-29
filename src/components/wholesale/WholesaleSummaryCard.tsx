import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DailySummary {
  id: string;
  date: string;
  branch: "Branch 1" | "Branch 2" | "Branch 3";
  cashReceived: number;
  mpesaReceived: number;
}

interface WholesaleSummaryCardProps {
  onSave: (summary: DailySummary) => void;
  isSubmitting?: boolean;
}

export const WholesaleSummaryCard = ({
  onSave,
  isSubmitting = false,
}: WholesaleSummaryCardProps) => {
  const today = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    date: string;
    branch: "Branch 1" | "Branch 2" | "Branch 3";
    cashReceived: number;
    mpesaReceived: number;
  }>({
    date: today,
    branch: "Branch 1",
    cashReceived: 0,
    mpesaReceived: 0,
  });

  const handleSubmit = async () => {
    // Validate inputs
    if (!formData.date) {
      alert("Please select a date");
      return;
    }

    const summary: DailySummary = {
      id: crypto.randomUUID(),
      date: formData.date,
      branch: formData.branch,
      cashReceived: Number(formData.cashReceived) || 0,
      mpesaReceived: Number(formData.mpesaReceived) || 0,
    };

    setLoading(true);
    try {
      await onSave(summary);
      // Reset form
      setFormData({
        date: today,
        branch: "Branch 1",
        cashReceived: 0,
        mpesaReceived: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg text-slate-50">
          Daily Summary Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Branch Selector */}
        <div>
          <label className="text-xs font-medium text-slate-300">Branch</label>
          <select
            className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-50"
            value={formData.branch}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "Branch 1" || value === "Branch 2" || value === "Branch 3") {
                setFormData({
                  ...formData,
                  branch: value,
                });
              }
            }}
          >
            <option value="Branch 1">Branch 1</option>
            <option value="Branch 2">Branch 2</option>
            <option value="Branch 3">Branch 3</option>
          </select>
        </div>

        {/* Date Selector */}
        <div>
          <label className="text-xs font-medium text-slate-300">Date</label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
            className="mt-2 h-10 bg-slate-800 text-slate-50"
          />
        </div>

        {/* Cash Received */}
        <div>
          <label className="text-xs font-medium text-slate-300">
            Cash Received (KES)
          </label>
          <Input
            type="number"
            placeholder="0"
            value={formData.cashReceived}
            onChange={(e) =>
              setFormData({
                ...formData,
                cashReceived: Number(e.target.value) || 0,
              })
            }
            className="mt-2 h-10 bg-slate-800 text-slate-50"
          />
        </div>

        {/* Mpesa Received */}
        <div>
          <label className="text-xs font-medium text-slate-300">
            Mpesa Received (KES)
          </label>
          <Input
            type="number"
            placeholder="0"
            value={formData.mpesaReceived}
            onChange={(e) =>
              setFormData({
                ...formData,
                mpesaReceived: Number(e.target.value) || 0,
              })
            }
            className="mt-2 h-10 bg-slate-800 text-slate-50"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || isSubmitting}
          className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {loading || isSubmitting ? "Saving..." : "Save Summary"}
        </Button>
      </CardContent>
    </Card>
  );
};
