import { motion } from "framer-motion";
import { Building2, Check, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

export type BranchId = "branch1" | "branch2" | "branch3";

interface Branch {
  id: BranchId;
  name: string;
  location: string;
  color: string;
  gradient: string;
}

const BRANCHES: Branch[] = [
  {
    id: "branch1",
    name: "Branch 1 - Downtown",
    location: "Main Street, City Center",
    color: "#3B82F6",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "branch2",
    name: "Branch 2 - Westside",
    location: "West Avenue, Mall Complex",
    color: "#10B981",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    id: "branch3",
    name: "Branch 3 - Eastgate",
    location: "East Road, Shopping District",
    color: "#F59E0B",
    gradient: "from-amber-500 to-amber-600",
  },
];

interface BranchSelectorProps {
  selectedBranch: BranchId;
  onSelect: (branchId: BranchId) => void;
}

export const BranchSelector = ({ selectedBranch, onSelect }: BranchSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {BRANCHES.map((branch) => {
        const isSelected = selectedBranch === branch.id;
        return (
          <motion.button
            key={branch.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(branch.id)}
            className="relative"
          >
            <Card
              className={`relative overflow-hidden p-6 text-left transition-all ${
                isSelected
                  ? "ring-4 ring-offset-2 shadow-2xl"
                  : "hover:shadow-lg border-2 border-gray-200"
              }`}
              style={isSelected ? {
                ["--tw-ring-color" as any]: branch.color,
              } : undefined}
            >
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${branch.gradient} opacity-${
                  isSelected ? "15" : "5"
                } transition-opacity`}
              />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl`}
                    style={{
                      backgroundColor: isSelected ? branch.color : "#F3F4F6",
                    }}
                  >
                    <Building2
                      className="h-6 w-6"
                      style={{
                        color: isSelected ? "white" : branch.color,
                      }}
                    />
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-2 rounded-full"
                      style={{ backgroundColor: branch.color }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </div>

                <h3
                  className={`text-lg font-black mb-2 ${
                    isSelected ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {branch.name}
                </h3>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold">{branch.location}</span>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <span className="text-xs font-black uppercase tracking-wider text-gray-600">
                      ✓ Active Branch
                    </span>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
};

// Compact version for header/navbar
export const BranchBadge = ({ branchId }: { branchId: BranchId }) => {
  const branch = BRANCHES.find((b) => b.id === branchId);
  if (!branch) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white font-bold text-sm shadow-lg"
      style={{ backgroundColor: branch.color }}
    >
      <Building2 className="h-4 w-4" />
      <span>{branch.name.split(" - ")[0]}</span>
    </div>
  );
};

export { BRANCHES };
