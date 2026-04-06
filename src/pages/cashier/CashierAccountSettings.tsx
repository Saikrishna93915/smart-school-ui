import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cashierService } from "@/Services/cashierService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Calendar,
  Clock,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  LogOut,
  Save,
  Edit2,
  Sun,
  Moon,
  Banknote,
  Receipt,
  BarChart3,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface CashierProfile {
  _id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branch: string;
  shiftTiming: string;
  status: "active" | "inactive" | "on-leave";
  createdAt: string;
  updatedAt: string;
}

interface ShiftSession {
  _id: string;
  cashierId: string;
  shiftDate: string;
  openingTime?: string;
  closingTime?: string;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  cashInHand?: number;
  status: "open" | "closed" | "pending";
  transactions?: {
    count: number;
    totalAmount: number;
    cash: number;
    online: number;
    upi: number;
    cheque: number;
  };
  variance?: number;
  notes?: string;
}

export default function CashierAccountSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CashierProfile | null>(null);
  const [currentShift, setCurrentShift] = useState<ShiftSession | null>(null);
  const [shiftHistory, setShiftHistory] = useState<ShiftSession[]>([]);
  const [showOpeningDialog, setShowOpeningDialog] = useState(false);
  const [showClosingDialog, setShowClosingDialog] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [cashInHand, setCashInHand] = useState("");

  const normalizeShift = useCallback((shift: any): ShiftSession => ({
    _id: shift._id,
    cashierId: shift.cashier?._id || "",
    shiftDate: shift.shiftDate,
    openingTime: shift.openingTime,
    closingTime: shift.closingTime,
    openingBalance: shift.openingBalance || 0,
    closingBalance: shift.closingBalance,
    cashInHand: shift.cashInHand,
    status: shift.status,
    transactions: {
      count: shift.transactions?.count || 0,
      totalAmount: shift.transactions?.totalAmount || 0,
      cash: shift.transactions?.cash || 0,
      online: shift.transactions?.online || 0,
      upi: shift.transactions?.upi || 0,
      cheque: shift.transactions?.cheque || 0,
    },
    variance: shift.variance,
    notes: shift.notes,
  }), []);

  const loadAccountData = useCallback(async () => {
    try {
      setLoading(true);

      const [currentShiftResponse, shiftsResponse] = await Promise.all([
        cashierService.getCurrentShift(),
        cashierService.getShifts({ limit: 20 }),
      ]);

      const currentShiftData = currentShiftResponse.data?.data?.currentShift;
      const shiftsData = shiftsResponse.data?.data?.shifts || [];

      const fullName = user?.name || "";
      const [firstName = "", ...restName] = fullName.split(" ");

      setProfile({
        _id: user?._id || user?.id || "cashier-user",
        userId: user?._id || user?.id || "cashier-user",
        employeeId: "",
        firstName,
        lastName: restName.join(" "),
        email: user?.email || "",
        phone: "",
        branch: "",
        shiftTiming: "",
        status: "active",
        createdAt: "",
        updatedAt: new Date().toISOString(),
      });
      setCurrentShift(currentShiftData ? normalizeShift(currentShiftData) : null);
      setShiftHistory(shiftsData.map(normalizeShift));
    } catch (error) {
      toast.error("Failed to load account settings");
    } finally {
      setLoading(false);
    }
  }, [normalizeShift, user]);

  useEffect(() => {
    loadAccountData();
  }, [loadAccountData]);

  const handleOpenShift = async () => {
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      toast.error("Please enter a valid opening balance");
      return;
    }

    try {
      await cashierService.openShift({
        openingBalance: parseFloat(openingBalance),
      });
      setShowOpeningDialog(false);
      setOpeningBalance("");
      await loadAccountData();
      toast.success("Shift opened successfully! You can now start collecting payments.");
    } catch (error) {
      toast.error("Failed to open shift");
    }
  };

  const handleCloseShift = async () => {
    if (!closingBalance || parseFloat(closingBalance) < 0) {
      toast.error("Please enter a valid closing balance");
      return;
    }

    try {
      await cashierService.closeShift((currentShift as ShiftSession)._id, {
        closingBalance: parseFloat(closingBalance),
        cashInHand: parseFloat(cashInHand || closingBalance),
        notes: closingNotes,
        variance: parseFloat(closingBalance) - parseFloat(cashInHand || closingBalance),
      });
      setShowClosingDialog(false);
      setClosingBalance("");
      setCashInHand("");
      setClosingNotes("");
      await loadAccountData();
      toast.success("Shift closed successfully! Report has been generated.");
    } catch (error) {
      toast.error("Failed to close shift");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 animate-pulse">
            <CheckCircle className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="text-gray-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, security settings, and shift sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/cashier/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* ====== SHIFT STATUS CARD ====== */}
      <Card className={currentShift?.status === "open" ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${currentShift?.status === "open" ? "bg-green-100" : "bg-amber-100"}`}>
                {currentShift?.status === "open" ? (
                  <Sun className="h-6 w-6 text-green-600" />
                ) : (
                  <Moon className="h-6 w-6 text-amber-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {currentShift?.status === "open" ? "Shift is Currently Open" : "No Active Shift"}
                  </h3>
                  {currentShift && getStatusBadge(currentShift.status)}
                </div>
                {currentShift?.status === "open" ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Opened at {currentShift.openingTime} • Opening Balance: {formatCurrency(currentShift.openingBalance)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Start your day by opening a new shift session
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {currentShift?.status === "open" ? (
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setShowClosingDialog(true)}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Close Shift
                </Button>
              ) : (
                <Button onClick={() => setShowOpeningDialog(true)}>
                  <Sun className="h-4 w-4 mr-2" />
                  Open Shift
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====== PROFILE INFORMATION ====== */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your personal and employment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{profile?.firstName} {profile?.lastName}</h3>
                <p className="text-sm text-muted-foreground">Employee ID: {profile?.employeeId}</p>
                <Badge className="mt-1" variant={profile?.status === "active" ? "default" : "secondary"}>
                  {profile?.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{profile?.email || "Not available"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{profile?.phone || "Not available"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Branch</p>
                  <p className="text-sm text-muted-foreground">{profile?.branch || "Not configured"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Shift Timing</p>
                  <p className="text-sm text-muted-foreground">{profile?.shiftTiming || "Not configured"}</p>
                </div>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => toast.info("Cashier profile editing is not connected yet")}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* ====== CHANGE PASSWORD ====== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password for security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter your current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
              />
              <p className="text-xs text-muted-foreground">
                At least 6 characters. Use uppercase, lowercase, and numbers.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
              />
            </div>
            <Button className="w-full" onClick={() => toast.info("Password update is not connected yet")}>
              <Lock className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ====== SHIFT HISTORY ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Shift Sessions
          </CardTitle>
          <CardDescription>Your shift opening and closing history</CardDescription>
        </CardHeader>
        <CardContent>
          {shiftHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No shift history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shiftHistory.map((shift) => (
                <div
                  key={shift._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(shift.shiftDate), "EEEE, MMMM dd, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {shift.openingTime} - {shift.closingTime}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(shift.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Opening Balance</p>
                      <p className="font-semibold">{formatCurrency(shift.openingBalance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Closing Balance</p>
                      <p className="font-semibold">{formatCurrency(shift.closingBalance || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Transactions</p>
                      <p className="font-semibold">{shift.transactions?.count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Collection</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(shift.transactions?.totalAmount || 0)}
                      </p>
                    </div>
                  </div>

                  {shift.variance && shift.variance !== 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <AlertCircle className={`h-4 w-4 ${shift.variance < 0 ? "text-red-600" : "text-green-600"}`} />
                      <span className={`text-sm ${shift.variance < 0 ? "text-red-600" : "text-green-600"}`}>
                        Variance: {formatCurrency(Math.abs(shift.variance))} {shift.variance < 0 ? "shortage" : "excess"}
                      </span>
                    </div>
                  )}

                  {shift.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <p className="text-muted-foreground">Notes: {shift.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== OPEN SHIFT DIALOG ====== */}
      <Dialog open={showOpeningDialog} onOpenChange={setShowOpeningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-600" />
              Open New Shift
            </DialogTitle>
            <DialogDescription>
              Start a new shift session. This will begin your daily collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="opening-balance">Opening Balance (Cash in Hand)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="opening-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-9"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the cash amount you're starting with (e.g., change fund)
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Once opened, you can start collecting payments. Remember to close the shift at the end of your session.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpeningDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleOpenShift}>
              <Sun className="h-4 w-4 mr-2" />
              Open Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== CLOSE SHIFT DIALOG ====== */}
      <Dialog open={showClosingDialog} onOpenChange={setShowClosingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-blue-600" />
              Close Shift Session
            </DialogTitle>
            <DialogDescription>
              End your current shift and generate a report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentShift && (
              <>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Shift Date</p>
                    <p className="font-medium">
                      {format(new Date(currentShift.shiftDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opened At</p>
                    <p className="font-medium">{currentShift.openingTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opening Balance</p>
                    <p className="font-medium">{formatCurrency(currentShift.openingBalance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="font-medium">{currentShift.transactions?.count || 0}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cash-in-hand">Actual Cash in Hand</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cash-in-hand"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      value={cashInHand}
                      onChange={(e) => setCashInHand(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Count the physical cash you have at the end of the shift
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closing-balance">Total Closing Amount (Cash + Digital)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="closing-balance"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      value={closingBalance}
                      onChange={(e) => setClosingBalance(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Include cash, UPI, online transfers, and cheques
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[80px] p-2 border rounded-md text-sm"
                    placeholder="Any discrepancies, issues, or notes for the next shift..."
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClosingDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseShift}>
              <LogOut className="h-4 w-4 mr-2" />
              Close Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
