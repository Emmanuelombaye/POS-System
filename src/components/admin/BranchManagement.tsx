import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Users,
  Package,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Phone,
  Mail,
  CheckCircle,
} from "lucide-react";
import { BRANCHES } from "@/components/branch/BranchSelector";
import { useAppStore } from "@/store/appStore";

interface BranchData {
  id: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
  email: string;
  staff: number;
  products: number;
  monthlyRevenue: number;
  status: "active" | "inactive";
}

const MOCK_BRANCHES: BranchData[] = [
  {
    id: "branch1",
    name: "Branch 1 - Downtown",
    location: "Main Street, City Center",
    manager: "James (Manager)",
    phone: "+254 712 345 678",
    email: "downtown@edentop.com",
    staff: 5,
    products: 45,
    monthlyRevenue: 2500000,
    status: "active",
  },
  {
    id: "branch2",
    name: "Branch 2 - Westside",
    location: "West Avenue, Mall Complex",
    manager: "Sarah (Manager)",
    phone: "+254 723 456 789",
    email: "westside@edentop.com",
    staff: 4,
    products: 38,
    monthlyRevenue: 1800000,
    status: "active",
  },
  {
    id: "branch3",
    name: "Branch 3 - Eastgate",
    location: "East Road, Shopping District",
    manager: "Peter (Manager)",
    phone: "+254 734 567 890",
    email: "eastgate@edentop.com",
    staff: 6,
    products: 52,
    monthlyRevenue: 3200000,
    status: "active",
  },
];

export const BranchManagement = () => {
  const { settings } = useAppStore();
  const [branches, setBranches] = useState<BranchData[]>(MOCK_BRANCHES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchData | null>(null);

  const totalStats = {
    branches: branches.length,
    staff: branches.reduce((sum, b) => sum + b.staff, 0),
    products: branches.reduce((sum, b) => sum + b.products, 0),
    revenue: branches.reduce((sum, b) => sum + b.monthlyRevenue, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-brand-burgundy" />
            Branch Management
          </h1>
          <p className="text-gray-500 font-semibold mt-1">Manage branches, staff assignments, and inventory transfers</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowTransferModal(true)}
            variant="outline"
            className="h-12 px-6 font-black border-2"
          >
            <ArrowRightLeft className="h-5 w-5 mr-2" />
            Transfer Stock
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-brand-burgundy to-red-600 h-12 px-6 font-black shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Branch
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Branches</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{totalStats.branches}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Staff</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{totalStats.staff}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Products</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{totalStats.products}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Monthly Revenue</p>
                <p className="text-2xl font-black text-gray-900 mt-2">{formatCurrency(totalStats.revenue)}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {branches.map((branch) => {
          const branchConfig = BRANCHES.find((b) => b.id === branch.id);
          return (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Card className="border-2 border-gray-200 hover:shadow-xl transition-all overflow-hidden">
                {/* Color Header */}
                <div
                  className="h-2"
                  style={{ backgroundColor: branchConfig?.color }}
                />

                <CardContent className="p-6">
                  {/* Branch Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${branchConfig?.color}20` }}
                      >
                        <Building2
                          className="h-6 w-6"
                          style={{ color: branchConfig?.color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-gray-900">{branch.name.split(" - ")[0]}</h3>
                        <p className="text-sm text-gray-600 font-semibold">{branch.name.split(" - ")[1]}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold mb-4 pb-4 border-b border-gray-200">
                    <MapPin className="h-4 w-4" />
                    {branch.location}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-gray-500 uppercase">Staff</p>
                      <p className="text-2xl font-black text-gray-900">{branch.staff}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-gray-500 uppercase">Products</p>
                      <p className="text-2xl font-black text-gray-900">{branch.products}</p>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-1">Monthly Revenue</p>
                    <p className="text-xl font-black text-emerald-700">{formatCurrency(branch.monthlyRevenue)}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 font-semibold">
                      <Users className="h-4 w-4" />
                      <span className="font-bold">Manager:</span> {branch.manager}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 font-semibold">
                      <Phone className="h-4 w-4" />
                      {branch.phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 font-semibold">
                      <Mail className="h-4 w-4" />
                      {branch.email}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBranch(branch)}
                      className="flex-1 font-bold border-2"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-bold border-2 text-blue-600 hover:bg-blue-50"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Stock Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTransferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <ArrowRightLeft className="h-6 w-6 text-brand-burgundy" />
                Transfer Stock Between Branches
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">From Branch</label>
                  <select className="w-full h-12 border-2 border-gray-300 rounded-lg px-4 font-semibold">
                    <option>Select source branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">To Branch</label>
                  <select className="w-full h-12 border-2 border-gray-300 rounded-lg px-4 font-semibold">
                    <option>Select destination branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Product</label>
                  <select className="w-full h-12 border-2 border-gray-300 rounded-lg px-4 font-semibold">
                    <option>Select product to transfer</option>
                    <option>Beef - Prime Cuts</option>
                    <option>Goat - Mixed</option>
                    <option>Beef Liver</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Quantity (kg)</label>
                  <Input
                    type="number"
                    placeholder="Enter quantity in kg"
                    className="h-12 text-base"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Notes (Optional)</label>
                  <textarea
                    placeholder="Add transfer notes..."
                    className="w-full h-24 border-2 border-gray-300 rounded-lg px-4 py-3 font-semibold resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 h-12 font-bold border-2"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-12 font-bold bg-gradient-to-r from-brand-burgundy to-red-600"
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer Stock
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
