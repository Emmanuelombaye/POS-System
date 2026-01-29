import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, Calendar, Banknote, Smartphone } from "lucide-react";

export interface DailySummary {
  id: string;
  date: string;
  branch: "Branch 1" | "Branch 2" | "Branch 3";
  cashReceived: number;
  mpesaReceived: number;
  // TODO: Add expenses or other fields if needed
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-brand-charcoal flex items-center gap-2">
          <Store className="h-5 w-5 text-brand-burgundy" />
          Daily Summary Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Branch Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Branch</label>
          <div className="relative">
            <select
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-charcoal focus:border-brand-burgundy outline-none appearance-none"
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
        </div>

        {/* Date Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Date</label>
          <div className="relative">
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="h-11 pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Cash Received */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block flex items-center gap-2">
            <Banknote className="h-3 w-3" /> Cash Received (KES)
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
            className="h-11 font-medium"
          />
        </div>

        {/* Mpesa Received */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block flex items-center gap-2">
            <Smartphone className="h-3 w-3" /> M-Pesa Received (KES)
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
            className="h-11 font-medium"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || isSubmitting}
          className="mt-4 w-full h-12 text-base shadow-lg shadow-brand-burgundy/20"
        >
          {loading || isSubmitting ? "Saving..." : "Save Summary"}
        </Button>
      </CardContent>
    </Card>
  );
};
