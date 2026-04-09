import React, { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Car,
  Fuel,
  Battery,
  Calendar,
  Wrench,
  Gauge,
  Camera,
  FileText,
  Save,
  Printer,
  Download,
  History,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Upload,
  AlertTriangle,
  RefreshCw,
  Signature,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// ...existing code...
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { driverService } from "@/Services/driverService";

// ==================== TYPES & INTERFACES ====================

interface ChecklistItem {
  id: string;
  name: string;
  status: "pass" | "fail" | "pending";
  notes?: string;
  photos?: string[];
}

interface ChecklistCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  items: ChecklistItem[];
  expanded: boolean;
}

interface VehicleInfo {
  id: string;
  busNumber: string;
  route: string;
  fuelLevel: number;
  batteryVoltage: number;
  batteryStatus: "good" | "warning" | "critical";
  odometer: number;
  lastServiceDate: string;
  nextServiceDate: string;
}

interface InspectionData {
  id: string;
  vehicleId: string;
  driverId: string;
  driverName: string;
  date: string;
  startTime: string;
  endTime?: string;
  categories: ChecklistCategory[];
  overallStatus: "pass" | "fail" | "in-progress";
  driverSignature?: string;
  notes?: string;
  synced: boolean;
}

interface InspectionHistory {
  id: string;
  date: string;
  status: "pass" | "fail" | "in-progress";
  issues: number;
  driverName: string;
}

// ==================== INITIAL DATA ====================

const initialVehicleInfo: VehicleInfo = {
  id: "vehicle-101",
  busNumber: "Bus #101",
  route: "Downtown Express",
  fuelLevel: 75,
  batteryVoltage: 12.6,
  batteryStatus: "good",
  odometer: 45230,
  lastServiceDate: "2024-02-15",
  nextServiceDate: "2024-05-15",
};

const initialCategories: ChecklistCategory[] = [
  {
    id: "exterior",
    name: "Exterior Check",
    description: "Inspect the outside of the vehicle",
    icon: Car,
    expanded: true,
    items: [
      { id: "ext-1", name: "Body Condition", status: "pending", notes: "", photos: [] },
      { id: "ext-2", name: "Lights & Headlights", status: "pending", notes: "", photos: [] },
      { id: "ext-3", name: "Tires & Wheels", status: "pending", notes: "", photos: [] },
      { id: "ext-4", name: "Windows & Mirrors", status: "pending", notes: "", photos: [] },
      { id: "ext-5", name: "License Plate", status: "pending", notes: "", photos: [] },
    ],
  },
  {
    id: "engine",
    name: "Engine Room Check",
    description: "Inspect the engine compartment",
    icon: Wrench,
    expanded: true,
    items: [
      { id: "eng-1", name: "Engine Oil Level", status: "pending", notes: "", photos: [] },
      { id: "eng-2", name: "Coolant Level", status: "pending", notes: "", photos: [] },
      { id: "eng-3", name: "Brake Fluid", status: "pending", notes: "", photos: [] },
      { id: "eng-4", name: "Power Steering Fluid", status: "pending", notes: "", photos: [] },
      { id: "eng-5", name: "Belts & Hoses", status: "pending", notes: "", photos: [] },
    ],
  },
  {
    id: "safety",
    name: "Safety Equipment",
    description: "Verify all safety equipment is present",
    icon: AlertTriangle,
    expanded: true,
    items: [
      { id: "saf-1", name: "Fire Extinguisher", status: "pending", notes: "", photos: [] },
      { id: "saf-2", name: "First Aid Kit", status: "pending", notes: "", photos: [] },
      { id: "saf-3", name: "Emergency Triangles", status: "pending", notes: "", photos: [] },
      { id: "saf-4", name: "Seat Belts", status: "pending", notes: "", photos: [] },
      { id: "saf-5", name: "Emergency Exits", status: "pending", notes: "", photos: [] },
    ],
  },
  {
    id: "interior",
    name: "Interior Check",
    description: "Inspect the inside of the vehicle",
    icon: Gauge,
    expanded: true,
    items: [
      { id: "int-1", name: "Dashboard Instruments", status: "pending", notes: "", photos: [] },
      { id: "int-2", name: "HVAC System", status: "pending", notes: "", photos: [] },
      { id: "int-3", name: "Seats & Handrails", status: "pending", notes: "", photos: [] },
      { id: "int-4", name: "Floor Condition", status: "pending", notes: "", photos: [] },
      { id: "int-5", name: "Cleanliness", status: "pending", notes: "", photos: [] },
    ],
  },
];

// ==================== UTILITY FUNCTIONS ====================

const calculateCategoryProgress = (category: ChecklistCategory): number => {
  const total = category.items.length;
  const completed = category.items.filter((item) => item.status !== "pending").length;
  return Math.round((completed / total) * 100);
};

const calculateOverallProgress = (categories: ChecklistCategory[]): number => {
  const total = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const completed = categories.reduce(
    (acc, cat) => acc + cat.items.filter((item) => item.status !== "pending").length,
    0
  );
  return Math.round((completed / total) * 100);
};

const getOverallStatus = (categories: ChecklistCategory[]): "pass" | "fail" | "in-progress" => {
  const allCompleted = categories.every((cat) =>
    cat.items.every((item) => item.status !== "pending")
  );
  if (!allCompleted) return "in-progress";

  const hasFailures = categories.some((cat) =>
    cat.items.some((item) => item.status === "fail")
  );
  return hasFailures ? "fail" : "pass";
};

const getBatteryColor = (status: string) => {
  switch (status) {
    case "good":
      return "text-green-600";
    case "warning":
      return "text-yellow-600";
    case "critical":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

const getFuelColor = (level: number) => {
  if (level >= 75) return "text-green-600";
  if (level >= 50) return "text-yellow-600";
  return "text-red-600";
};

// ==================== MAIN COMPONENT ====================

export default function VehicleChecklistPage() {
  const { isOnline } = useNetworkStatus();
  const [, setOfflineQueue] = useLocalStorage<any[]>("checklist-offline-queue", []);

  // State
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>(initialVehicleInfo);
  const [categories, setCategories] = useState<ChecklistCategory[]>(initialCategories);
  const [driverSignature, setDriverSignature] = useState<string>("");
  const [inspectionNotes, setInspectionNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    categoryId: string;
    itemId: string;
    itemName: string;
  } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [inspectionHistory, setInspectionHistory] = useState<InspectionHistory[]>([
    { id: "1", date: "2024-03-19", status: "pass", issues: 0, driverName: "John Doe" },
    { id: "2", date: "2024-03-18", status: "pass", issues: 0, driverName: "John Doe" },
    { id: "3", date: "2024-03-17", status: "fail", issues: 2, driverName: "Jane Smith" },
    { id: "4", date: "2024-03-16", status: "pass", issues: 0, driverName: "John Doe" },
    { id: "5", date: "2024-03-15", status: "pass", issues: 0, driverName: "John Doe" },
  ]);

  // Computed values
  const overallProgress = calculateOverallProgress(categories);
  const overallStatus = getOverallStatus(categories);
  const startTime = format(new Date(), "HH:mm:ss");
  const inspectionDate = format(new Date(), "yyyy-MM-dd");

  // Load vehicle info from API
  useEffect(() => {
    const loadVehicleInfo = async () => {
      try {
        const response = await driverService.getMyVehicle();
        if (response.data) {
          setVehicleInfo({
            ...initialVehicleInfo,
            ...response.data,
          });
        }
      } catch (error) {
        console.error("Failed to load vehicle info:", error);
      }
    };
    loadVehicleInfo();
  }, []);

  // Handlers
  const handleToggleCategory = useCallback((categoryId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
      )
    );
  }, []);

  const handleStatusChange = useCallback(
    (categoryId: string, itemId: string, status: "pass" | "fail") => {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: cat.items.map((item) =>
                  item.id === itemId ? { ...item, status } : item
                ),
              }
            : cat
        )
      );
    },
    []
  );

  const handleAddPhoto = useCallback(
    (categoryId: string, itemId: string, photoData: string) => {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: cat.items.map((item) =>
                  item.id === itemId
                    ? { ...item, photos: [...(item.photos || []), photoData] }
                    : item
                ),
              }
            : cat
        )
      );
    },
    []
  );

  const handleRemovePhoto = useCallback(
    (categoryId: string, itemId: string, photoIndex: number) => {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: cat.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        photos: item.photos?.filter((_, idx) => idx !== photoIndex),
                      }
                    : item
                ),
              }
            : cat
        )
      );
    },
    []
  );

  const handleOpenPhotoDialog = useCallback(
    (categoryId: string, itemId: string, itemName: string, photoData?: string) => {
      setSelectedItem({ categoryId, itemId, itemName });
      setPhotoPreview(photoData || "");
      setShowPhotoDialog(true);
    },
    []
  );

  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedItem) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const photoData = reader.result as string;
          handleAddPhoto(selectedItem.categoryId, selectedItem.itemId, photoData);
          setPhotoPreview(photoData);
          toast.success("Photo uploaded successfully");
        };
        reader.readAsDataURL(file);
      }
    },
    [selectedItem, handleAddPhoto]
  );

  const handleResetInspection = useCallback(() => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({ ...item, status: "pending", notes: "", photos: [] })),
      }))
    );
    setDriverSignature("");
    setInspectionNotes("");
    toast.info("Inspection reset");
  }, []);

  const handleSubmitInspection = useCallback(async () => {
    if (!driverSignature) {
      toast.error("Driver signature required", {
        description: "Please provide your signature before submitting",
      });
      return;
    }

    setIsSubmitting(true);

    const inspectionData: InspectionData = {
      id: `inspection-${Date.now()}`,
      vehicleId: vehicleInfo.id,
      driverId: "driver-001",
      driverName: "Current Driver",
      date: inspectionDate,
      startTime,
      endTime: format(new Date(), "HH:mm:ss"),
      categories,
      overallStatus,
      driverSignature,
      notes: inspectionNotes,
      synced: isOnline,
    };

    try {
      if (isOnline) {
        await driverService.submitChecklist(inspectionData as unknown as Record<string, unknown>);
        toast.success("Inspection submitted successfully");
        setInspectionHistory((prev) => [
          {
            id: inspectionData.id,
            date: inspectionData.date,
            status: inspectionData.overallStatus,
            issues: categories.reduce(
              (acc, cat) =>
                acc + cat.items.filter((item) => item.status === "fail").length,
              0
            ),
            driverName: inspectionData.driverName,
          },
          ...prev,
        ]);
      } else {
        setOfflineQueue((prev) => [...prev, { type: "checklist", data: inspectionData }]);
        toast.success("Inspection saved offline", {
          description: "Will sync when you're back online",
        });
      }

      setShowSubmitDialog(false);
      handleResetInspection();
    } catch (error) {
      toast.error("Failed to submit inspection", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    driverSignature,
    vehicleInfo.id,
    inspectionDate,
    startTime,
    categories,
    overallStatus,
    inspectionNotes,
    isOnline,
    setOfflineQueue,
    handleResetInspection,
  ]);

  const handleExport = useCallback(() => {
    const report = {
      vehicle: vehicleInfo,
      date: inspectionDate,
      startTime,
      driver: "Current Driver",
      overallStatus,
      progress: overallProgress,
      categories: categories.map((cat) => ({
        name: cat.name,
        items: cat.items.map((item) => ({
          name: item.name,
          status: item.status,
          notes: item.notes,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vehicle-inspection-${inspectionDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  }, [vehicleInfo, inspectionDate, startTime, overallStatus, overallProgress, categories]);

  const canSubmit = overallStatus !== "in-progress" && driverSignature;

  // Render functions
  const renderStatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    colorClass,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    colorClass?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClass || "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass || ""}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  const renderCategoryCard = (category: ChecklistCategory, _index: number) => {
    const progress = calculateCategoryProgress(category);
    const failedItems = category.items.filter((item) => item.status === "fail").length;
    const pendingItems = category.items.filter((item) => item.status === "pending").length;
    const Icon = category.icon;

    return (
      <Card key={category.id} className="hover:shadow-md transition-shadow">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => handleToggleCategory(category.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleToggleCategory(category.id);
            }
          }}
          aria-expanded={category.expanded}
          aria-controls={`category-content-${category.id}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  progress === 100
                    ? "bg-green-100"
                    : failedItems > 0
                    ? "bg-red-100"
                    : "bg-blue-100"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    progress === 100
                      ? "text-green-600"
                      : failedItems > 0
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                />
              </div>
              <div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{progress}%</div>
                <div className="text-xs text-muted-foreground">
                  {pendingItems > 0 ? `${pendingItems} pending` : "Complete"}
                </div>
              </div>
              {category.expanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
          <Progress value={progress} className="mt-4 h-2" />
        </CardHeader>
        {category.expanded && (
          <CardContent id={`category-content-${category.id}`} className="space-y-4 pt-4">
            {category.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  item.status === "pass"
                    ? "bg-green-50 border-green-200"
                    : item.status === "fail"
                    ? "bg-red-50 border-red-200"
                    : "bg-muted/30 border-muted"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.notes && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Note
                      </Badge>
                    )}
                    {item.photos && item.photos.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {item.photos.length}
                      </Badge>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={item.status === "pass" ? "default" : "outline"}
                    className={
                      item.status === "pass" ? "bg-green-600 hover:bg-green-700" : ""
                    }
                    onClick={() =>
                      handleStatusChange(category.id, item.id, "pass")
                    }
                    aria-label={`Mark ${item.name} as pass`}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={item.status === "fail" ? "default" : "outline"}
                    className={
                      item.status === "fail" ? "bg-red-600 hover:bg-red-700" : ""
                    }
                    onClick={() =>
                      handleStatusChange(category.id, item.id, "fail")
                    }
                    aria-label={`Mark ${item.name} as fail`}
                  >
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleOpenPhotoDialog(category.id, item.id, item.name)
                    }
                    aria-label={`Add photo for ${item.name}`}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    );
  };

  const renderSubmitDialog = () => (
    <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Submit Inspection Report
          </DialogTitle>
          <DialogDescription>
            Review your inspection before submitting
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vehicle</Label>
              <p className="font-medium">{vehicleInfo.busNumber}</p>
            </div>
            <div>
              <Label>Route</Label>
              <p className="font-medium">{vehicleInfo.route}</p>
            </div>
            <div>
              <Label>Date</Label>
              <p className="font-medium">{inspectionDate}</p>
            </div>
            <div>
              <Label>Start Time</Label>
              <p className="font-medium">{startTime}</p>
            </div>
          </div>
          <Separator />
          <div>
            <Label>Overall Status</Label>
            <div className="flex items-center gap-2 mt-1">
              {overallStatus === "pass" ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Pass
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Fail
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {overallProgress}% complete
              </span>
            </div>
          </div>
          {categories.some((cat) =>
            cat.items.some((item) => item.status === "fail")
          ) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <Label className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Failed Items
              </Label>
              <ul className="mt-2 space-y-1">
                {categories.flatMap((cat) =>
                  cat.items
                    .filter((item) => item.status === "fail")
                    .map((item) => (
                      <li key={item.id} className="text-sm text-red-700">
                        • {cat.name}: {item.name}
                        {item.notes && ` - ${item.notes}`}
                      </li>
                    ))
                )}
              </ul>
            </div>
          )}
          <div>
            <Label htmlFor="signature">Driver Signature *</Label>
            <div className="border rounded-lg p-4 mt-1 bg-muted/30">
              {driverSignature ? (
                <div className="font-handwriting text-2xl">{driverSignature}</div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Signature not provided
                </p>
              )}
            </div>
            {!driverSignature && (
              <p className="text-xs text-red-600 mt-1">
                Signature is required
              </p>
            )}
          </div>
          {inspectionNotes && (
            <div>
              <Label>Additional Notes</Label>
              <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                {inspectionNotes}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitInspection}
            disabled={isSubmitting || !canSubmit}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? "Submitting..." : "Submit Inspection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderHistoryDialog = () => (
    <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Inspection History
          </DialogTitle>
          <DialogDescription>
            Previous vehicle inspections
          </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] pr-4 overflow-y-auto">
          <div className="space-y-4">
            {inspectionHistory.map((inspection) => (
              <Card key={inspection.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          inspection.status === "pass"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        {inspection.status === "pass" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(inspection.date), "EEEE, MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Driver: {inspection.driverName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          inspection.status === "pass"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {inspection.status === "pass" ? "Pass" : "Fail"}
                      </Badge>
                      {inspection.issues > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {inspection.issues} issue(s)
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderPhotoDialog = () => (
    <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {selectedItem ? `Photo: ${selectedItem.itemName}` : "Photo"}
          </DialogTitle>
          <DialogDescription>
            Upload or view photo for this item
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Inspection photo"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => {
                  if (selectedItem) {
                    handleRemovePhoto(
                      selectedItem.categoryId,
                      selectedItem.itemId,
                      categories
                        .find((c) => c.id === selectedItem.categoryId)
                        ?.items.findIndex((i) => i.id === selectedItem.itemId) || 0
                    );
                    setPhotoPreview("");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No photo uploaded yet
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="photo-upload">Upload Photo</Label>
            <div className="flex items-center gap-2 mt-2">
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() =>
                  document.getElementById("photo-upload")?.click()
                }
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setShowPhotoDialog(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Main render
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 print:p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Checklist</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <ClipboardList className="h-4 w-4" />
            Complete your daily vehicle inspection
            {!isOnline && (
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryDialog(true)}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => setShowSubmitDialog(true)}
            disabled={overallStatus === "in-progress"}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Submit
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Inspection Progress</span>
            </div>
            <div className="flex items-center gap-2">
              {overallStatus === "pass" ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready to Submit
                </Badge>
              ) : overallStatus === "fail" ? (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Issues Found
                </Badge>
              ) : (
                <Badge variant="outline">In Progress</Badge>
              )}
              <span className="text-sm font-medium">{overallProgress}%</span>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Vehicle Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStatCard({
          title: "Vehicle",
          value: vehicleInfo.busNumber,
          subtitle: vehicleInfo.route,
          icon: Car,
        })}
        {renderStatCard({
          title: "Fuel Level",
          value: `${vehicleInfo.fuelLevel}%`,
          subtitle:
            vehicleInfo.fuelLevel < 25 ? "Low fuel - Refuel soon" : "Last filled: Yesterday",
          icon: Fuel,
          colorClass: getFuelColor(vehicleInfo.fuelLevel),
        })}
        {renderStatCard({
          title: "Battery",
          value: `${vehicleInfo.batteryVoltage}V`,
          subtitle: `Status: ${vehicleInfo.batteryStatus.toUpperCase()}`,
          icon: Battery,
          colorClass: getBatteryColor(vehicleInfo.batteryStatus),
        })}
        {renderStatCard({
          title: "Last Inspection",
          value: inspectionHistory[0]?.date || "N/A",
          subtitle: inspectionHistory[0]?.driverName || "",
          icon: Calendar,
        })}
      </div>

      {/* Checklist Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map(renderCategoryCard)}
      </div>

      {/* Signature & Notes */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signature className="h-5 w-5" />
            Driver Acknowledgment
          </CardTitle>
          <CardDescription>
            Provide your signature and any additional notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="signature-input">Type your signature</Label>
            <div className="flex gap-2 mt-2">
              <Textarea
                id="signature-input"
                placeholder="Type your full name as signature"
                value={driverSignature}
                onChange={(e) => setDriverSignature(e.target.value)}
                className="flex-1 font-handwriting text-lg"
                rows={2}
              />
              {driverSignature && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDriverSignature("")}
                  className="h-fit"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or observations..."
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handleResetInspection}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Inspection
        </Button>
      </div>

      {/* Dialogs */}
      {renderSubmitDialog()}
      {renderHistoryDialog()}
      {renderPhotoDialog()}

      {/* Print-only section */}
      <div className="hidden print:block">
        <h2 className="text-2xl font-bold mb-4">Vehicle Inspection Report</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="font-medium">Vehicle:</p>
            <p>{vehicleInfo.busNumber}</p>
          </div>
          <div>
            <p className="font-medium">Route:</p>
            <p>{vehicleInfo.route}</p>
          </div>
          <div>
            <p className="font-medium">Date:</p>
            <p>{inspectionDate}</p>
          </div>
          <div>
            <p className="font-medium">Start Time:</p>
            <p>{startTime}</p>
          </div>
        </div>
        <div className="mb-6">
          <p className="font-medium mb-2">Overall Status:</p>
          <Badge
            className={
              overallStatus === "pass"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }
          >
            {overallStatus.toUpperCase()}
          </Badge>
        </div>
      </div>
    </div>
  );
}
