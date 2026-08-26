import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  Flame,
  Droplets,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  RefreshCw,
  Zap,
  Sliders,
  Scale,
  RotateCcw,
  Video,
  VideoOff,
  Check,
  ArrowRight,
  BookOpen,
  MessageSquare,
  LayoutGrid,
} from "lucide-react";
import { api } from "../../api";
import { FoodScanResponse, MealItem, UserProfile } from "../../types";
import { getTimeOfDay } from "../../lib/utils";

interface FoodScannerProps {
  userProfile: UserProfile | null;
  onMealLogged: (meal: MealItem) => void;
  onNavigateToTracker?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToAdvisor?: () => void;
  onNavigateToDietPlan?: () => void;
  onClose?: () => void;
}

export const FoodScanner: React.FC<FoodScannerProps> = ({
  userProfile,
  onMealLogged,
  onNavigateToTracker,
  onNavigateToDashboard,
  onNavigateToAdvisor,
  onNavigateToDietPlan,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [mimeTypes, setMimeTypes] = useState<string[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<FoodScanResponse | null>(null);
  const [baseScan, setBaseScan] = useState<FoodScanResponse | null>(null);
  const [portionWeight, setPortionWeight] = useState<number>(0);
  const [mealSlot, setMealSlot] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<"AI_SUCCESS" | "AI_UNAVAILABLE" | "AI_INVALID_RESULT" | "IMAGE_INVALID" | "LOW_CONFIDENCE" | "DAILY_LIMIT_REACHED" | "IMAGE_STORAGE_UNAVAILABLE" | null>(null);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Editable fields state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editCalories, setEditCalories] = useState<number>(0);
  const [editProtein, setEditProtein] = useState<number>(0);
  const [editCarbs, setEditCarbs] = useState<number>(0);
  const [editFats, setEditFats] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default meal slot by time of day
  useEffect(() => {
    const time = getTimeOfDay();
    if (time === "Morning") setMealSlot("Breakfast");
    else if (time === "Afternoon") setMealSlot("Lunch");
    else if (time === "Evening") setMealSlot("Dinner");
    else setMealSlot("Snack");
  }, []);

  // Sync editing fields when scan result arrives
  useEffect(() => {
    if (scanResult) {
      setEditName(scanResult.mealName || "");
      setEditCalories(Math.round(scanResult.nutrition?.calories ?? 0));
      setEditProtein(Math.round(scanResult.nutrition?.protein ?? 0));
      setEditCarbs(Math.round(scanResult.nutrition?.carbs ?? 0));
      setEditFats(Math.round(scanResult.nutrition?.fat ?? 0));
    }
  }, [scanResult]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startCameraStream = async () => {
    try {
      setErrorMsg(null);
      if (streamRef.current) {
        stopCameraStream();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setErrorMsg("Camera access failed or was denied. You can still upload a photo.");
      setIsCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    stopCameraStream();
    setSelectedImage(dataUrl);
    setSelectedImages([dataUrl]);
    setMimeType("image/jpeg");
    setMimeTypes(["image/jpeg"]);
    runScan([dataUrl], ["image/jpeg"]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (Array.from(e.target.files || []) as File[]).slice(0, 4);
    if (files.length === 0) return;

    setErrorMsg(null);
    setSavedSuccess(false);
    setScanResult(null);
    setBaseScan(null);
    setScanStatus(null);
    const readFile = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
        reader.readAsDataURL(file);
      });

    Promise.all(files.map(readFile))
      .then((images) => {
        const types = files.map((file) => file.type || "image/jpeg");
        setSelectedImage(images[0]);
        setSelectedImages(images);
        setMimeType(types[0]);
        setMimeTypes(types);
        stopCameraStream();
        runScan(images, types);
      })
      .catch((err: Error) => setErrorMsg(err.message || "Could not read the selected photos."));
  };

  const runScan = async (imgData: string | string[], mime: string | string[]) => {
    setScanning(true);
    setErrorMsg(null);
    setSavedSuccess(false);
    setScanStatus(null);

    try {
      const userTargets = userProfile
        ? {
            calories: userProfile.calorie_target,
            protein: userProfile.protein_target,
            carbs: userProfile.carbs_target,
            fats: userProfile.fats_target,
          }
        : undefined;

      const result = await api.scanFood(
        imgData,
        mime,
        userProfile?.goal || "Maintenance",
        userTargets
      );

      setScanResult(result);
      setBaseScan(result);
      setPortionWeight(result.estimatedWeightG ?? 0);
      setScanStatus(result.confidence < 0.5 ? "LOW_CONFIDENCE" : "AI_SUCCESS");
    } catch (err: any) {
      console.error("Scanning failed:", err);
      const code = err.errorCode || err.code || "AI_UNAVAILABLE";
      setScanStatus(code);
      setErrorMsg(err.message || "Failed to analyze image with AI.");
    } finally {
      setScanning(false);
    }
  };

  // Adjust portion size slider
  const handlePortionChange = (newGrams: number) => {
    setPortionWeight(newGrams);
    if (!baseScan || !baseScan.nutrition) return;
    const baseWeight = baseScan.estimatedWeightG;
    if (!baseWeight) return;
    const factor = newGrams / baseWeight;
    setScanResult({
      ...baseScan,
      nutrition: {
        calories: Math.round((baseScan.nutrition.calories ?? 0) * factor),
        protein: Math.round((baseScan.nutrition.protein ?? 0) * factor * 10) / 10,
        carbs: Math.round((baseScan.nutrition.carbs ?? 0) * factor * 10) / 10,
        fat: Math.round((baseScan.nutrition.fat ?? 0) * factor * 10) / 10,
        fiber: Math.round((baseScan.nutrition.fiber ?? 0) * factor * 10) / 10,
      },
    });
  };

  // Preset sample plates adhering to specific identification & honest metabolic insight
  const handleQuickDemoPlate = (
    plateName: string,
    calories = 320,
    protein = 28,
    carbs = 27,
    fats = 12,
    weight = 350,
    glycemic: "Low" | "Medium" | "High" = "Medium",
    rating = 8,
    metabolic = "Steady glycemic release with sustained satiety.",
    reasoning = "Bioavailable macronutrients balanced for muscle preservation and metabolic health."
  ) => {
    stopCameraStream();
    let demoImg = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80";
    if (plateName.includes("Donut")) {
      demoImg = "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80";
    } else if (plateName.includes("Biryani")) {
      demoImg = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80";
    } else if (plateName.includes("Eggs")) {
      demoImg = "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80";
    }

    setSelectedImage(demoImg);
    runScan(demoImg, "image/jpeg");
  };

  const handleSaveToTracker = async () => {
    const userEmail = userProfile?.email || localStorage.getItem("user_email") || "guest@nutrisync.app";
    if (!scanResult || (!scanStatus && !isEditing)) {
      setErrorMsg("Please scan or enter food details before logging this meal.");
      return;
    }

    const currentName = (isEditing ? editName : scanResult.mealName) || "Logged Meal";
    const currentCalories = Math.max(0, Number(isEditing ? editCalories : scanResult.nutrition?.calories) || 0);
    const currentProtein = Math.max(0, Number(isEditing ? editProtein : scanResult.nutrition?.protein) || 0);
    const currentCarbs = Math.max(0, Number(isEditing ? editCarbs : scanResult.nutrition?.carbs) || 0);
    const currentFats = Math.max(0, Number(isEditing ? editFats : scanResult.nutrition?.fat) || 0);
    const currentFiber = Math.max(0, Number(scanResult.nutrition?.fiber) || 0);

    const imagesToSave = scanResult.imageUrls && scanResult.imageUrls.length > 0
      ? scanResult.imageUrls
      : selectedImages.length > 0
      ? selectedImages
      : selectedImage
      ? [selectedImage]
      : [];

    setSaving(true);
    try {
      const newMeal: Partial<MealItem> = {
        user_email: userEmail,
        food_name: currentName,
        calories: Math.round(currentCalories),
        protein: Math.round(currentProtein * 10) / 10,
        carbs: Math.round(currentCarbs * 10) / 10,
        fats: Math.round(currentFats * 10) / 10,
        fiber: Math.round(currentFiber * 10) / 10,
        glycemic_index: scanResult.glycemicIndex || "Medium",
        metabolic_impact: scanResult.metabolicImpact || scanResult.reasoning || "",
        nutrition_reasoning: scanResult.reasoning || "",
        meal_type: mealSlot,
        image_urls: imagesToSave,
        image_url: imagesToSave[0],
        foods: scanResult.foods,
        nutrition: scanResult.nutrition,
        ai_metadata: {
          source: scanResult.source,
          model: scanResult.model,
          confidence: scanResult.confidence,
          warnings: scanResult.warnings,
        },
        consumed_at: new Date().toISOString(),
        consumedAt: new Date().toISOString(),
        date_status: "exact",
        dateStatus: "exact",
        created_at: new Date().toISOString(),
      };

      const saved = await api.logMeal(newMeal);
      onMealLogged(saved);
      setSavedSuccess(true);
    } catch (err: any) {
      setErrorMsg("Failed to save meal: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    stopCameraStream();
    setSelectedImage(null);
    setSelectedImages([]);
    setMimeTypes([]);
    setScanResult(null);
    setBaseScan(null);
    setScanStatus(null);
    setErrorMsg(null);
    setSavedSuccess(false);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const targetProtein = userProfile?.protein_target || 120;
  const targetCarbs = userProfile?.carbs_target || 200;
  const targetFats = userProfile?.fats_target || 60;

  return (
    <div id="food-scanner-container" className="max-w-xl mx-auto pb-24 px-2">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
        id="camera-photo-input"
      />

      {/* Top App Header */}
      <div className="flex items-center justify-between py-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              NutriSync Vision AI
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Gemini 3.7 Vision
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expert optical portion breakdown & honest metabolic analysis
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Camera Mode vs Platter Viewport */}
      <div className="relative flex flex-col items-center justify-center my-3">
        {/* Live Camera Viewfinder */}
        {isCameraActive ? (
          <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden border-4 border-slate-900 dark:border-slate-700 shadow-2xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder crosshairs */}
            <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-cyan-400 animate-ping" />
            </div>

            {/* Camera Controls */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-10 px-4">
              <button
                onClick={stopCameraStream}
                className="w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center backdrop-blur-md cursor-pointer"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                onClick={capturePhotoFromCamera}
                className="w-16 h-16 rounded-full bg-white border-4 border-sky-400 shadow-lg flex items-center justify-center text-sky-600 hover:scale-105 active:scale-95 transition cursor-pointer"
                title="Take Snapshot"
              >
                <div className="w-12 h-12 rounded-full bg-sky-500" />
              </button>

              <button
                onClick={() => {
                  setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
                  startCameraStream();
                }}
                className="w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center backdrop-blur-md cursor-pointer"
                title="Switch Camera"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Circular Platter / Upload Box */
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-white/80 dark:border-slate-800 shadow-2xl bg-gradient-to-tr from-sky-100 to-indigo-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center group">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Scanned Food Plate"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 flex flex-col items-center justify-center space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={startCameraStream}
                    className="w-14 h-14 rounded-2xl bg-white/90 dark:bg-slate-800 text-sky-500 dark:text-sky-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition cursor-pointer"
                    title="Open Live Camera"
                  >
                    <Video className="w-7 h-7" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl bg-white/90 dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition cursor-pointer"
                    title="Upload from Device"
                  >
                    <Upload className="w-7 h-7" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Live Cam or Upload
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Multimodal AI portion breakdown (up to 4 photos)
                  </p>
                </div>
              </div>
            )}

            {/* Scanning Overlay Animation */}
            {scanning && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                <div className="relative w-14 h-14 mb-2">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                  <Sparkles className="w-6 h-6 text-cyan-300 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-xs font-bold text-white">Gemini Analyzing Plate...</p>
                <span className="text-[10px] text-slate-300 mt-0.5">
                  Calculating portion density & glycemic impact
                </span>
              </div>
            )}
          </div>
        )}

        {/* Quick Demo Previews if not uploaded */}
        {!selectedImage && !scanning && !isCameraActive && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-md mx-auto">
            <span className="text-[11px] font-bold text-slate-400 w-full text-center">
              Try NutriSync Vision AI sample dishes:
            </span>
            <button
              onClick={() =>
                handleQuickDemoPlate(
                  "Glazed Chocolate Donut",
                  290,
                  3.5,
                  38,
                  15,
                  85,
                  "High",
                  2,
                  "Rapid glycemic surge driven by refined flour and simple sugars. Minimal protein satiety.",
                  "High simple sugars and refined fats; minimal protein satiety. Pair with a boiled egg or whey shake to blunt insulin spike."
                )
              }
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-pink-500 transition shadow-sm cursor-pointer"
            >
              🍩 Glazed Chocolate Donut
            </button>
            <button
              onClick={() =>
                handleQuickDemoPlate(
                  "Paneer Butter Masala with 2 Rotis",
                  520,
                  22,
                  54,
                  26,
                  380,
                  "Medium",
                  7,
                  "Moderate glycemic impact buffered by dairy casein and complex whole-wheat fiber.",
                  "Rich in slow-digesting casein protein; balance rich gravy by pairing with a fresh salad or buttermilk."
                )
              }
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition shadow-sm cursor-pointer"
            >
              🥘 Paneer Butter Masala & 2 Rotis
            </button>
            <button
              onClick={() =>
                handleQuickDemoPlate(
                  "Chicken Biryani with Raita",
                  610,
                  34,
                  68,
                  22,
                  450,
                  "Medium",
                  8,
                  "High bioavailable animal protein with sustained energy from spiced basmati and cooling probiotic curd raita.",
                  "High protein yield from chicken breast/thigh. Opt for cucumber raita to increase digestive enzyme activity."
                )
              }
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-500 transition shadow-sm cursor-pointer"
            >
              🍗 Chicken Biryani & Raita
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sheet Card */}
      <div className="genz-card p-6 mt-4 relative space-y-5">
        {/* Card Handle Indicator */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-2" />

        {/* Plate Title & Weight / Kcal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-1 text-base font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            ) : (
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white capitalize">
                {scanResult?.mealName}
              </h3>
            )}

            <div className="flex items-center gap-1.5 mt-2">
              {(["Breakfast", "Lunch", "Dinner", "Snack"] as const).map((slot) => (
                <button
                  key={slot}
                  onClick={() => setMealSlot(slot)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition ${
                    mealSlot === slot
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {isEditing ? editCalories : Math.round(scanResult?.nutrition?.calories ?? 0)}{" "}
              <span className="text-xs font-semibold text-slate-400">kcal</span>
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-0.5 justify-end">
              <Scale className="w-3 h-3 text-slate-400" />
              <span>{portionWeight}g weight</span>
            </div>
          </div>
        </div>

        {/* Dynamic Portion Weight Slider */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-500" />
              <span>Adjust Portion Size:</span>
            </span>
            <span className="text-sky-600 dark:text-sky-400 font-extrabold">
              {portionWeight}g ({Math.round((portionWeight / 350) * 100)}% scale)
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={700}
            step={25}
            value={portionWeight}
            onChange={(e) => handlePortionChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>

        {/* Key Nutrients Grid with Progress Bars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Key Nutrients
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              {isEditing ? "Done Editing" : "Tweak Values"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Protein */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Protein</span>
              </div>
              <div className="my-1">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((isEditing ? editProtein : scanResult?.nutrition?.protein ?? 0) / targetProtein) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={editProtein}
                  onChange={(e) => setEditProtein(Number(e.target.value))}
                  className="w-full px-1.5 py-0.5 text-xs font-bold border rounded"
                />
              ) : (
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1">
                  {Math.round(scanResult?.nutrition?.protein ?? 0)}
                  <span className="text-[10px] text-slate-400 font-normal">/{targetProtein}g</span>
                </span>
              )}
            </div>

            {/* Carbs */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Carbs</span>
              </div>
              <div className="my-1">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((isEditing ? editCarbs : scanResult?.nutrition?.carbs ?? 0) / targetCarbs) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={editCarbs}
                  onChange={(e) => setEditCarbs(Number(e.target.value))}
                  className="w-full px-1.5 py-0.5 text-xs font-bold border rounded"
                />
              ) : (
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1">
                  {Math.round(scanResult?.nutrition?.carbs ?? 0)}
                  <span className="text-[10px] text-slate-400 font-normal">/{targetCarbs}g</span>
                </span>
              )}
            </div>

            {/* Fat */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Fat</span>
              </div>
              <div className="my-1">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((isEditing ? editFats : scanResult?.nutrition?.fat ?? 0) / targetFats) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={editFats}
                  onChange={(e) => setEditFats(Number(e.target.value))}
                  className="w-full px-1.5 py-0.5 text-xs font-bold border rounded"
                />
              ) : (
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1">
                  {Math.round(scanResult?.nutrition?.fat ?? 0)}
                  <span className="text-[10px] text-slate-400 font-normal">/{targetFats}g</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Health Tips Card + Decision Engine Action */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-pink-50/40 dark:from-slate-900 dark:via-purple-950/30 dark:to-indigo-950/20 border border-purple-200/60 dark:border-purple-500/20 space-y-2">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-400 p-[2px] shadow-sm">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                </div>
              </div>
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 block">
                  AI Decision Engine • Next Action
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  Target: {userProfile?.goal || "Protein Focus"}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                {scanResult?.reasoning || "Upload or capture a meal photo to calculate optical portion and metabolic breakdown."}
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{scanStatus ? `${scanStatus}: ` : ""}{errorMsg}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {selectedImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => runScan(selectedImages, mimeTypes)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition"
                >
                  Retry Scan
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleQuickDemoPlate(
                    "Manual Plate Entry",
                    450,
                    20,
                    50,
                    15,
                    350,
                    "Medium",
                    8,
                    "Balanced nutrition customized for your daily targets.",
                    "Estimated meal breakdown. Adjust portions or macros as needed."
                  );
                  setIsEditing(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold text-[11px] hover:bg-slate-100 transition"
              >
                Log Manually with Presets
              </button>
            </div>
          </div>
        )}

        {/* Saved Success - AI Loop Next Step Briefing */}
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-slate-900 dark:via-emerald-950/30 dark:to-indigo-950/30 border border-emerald-300/80 dark:border-emerald-500/30 space-y-3.5 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Meal Saved • AI Loop Updated ⚡
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Added +{Math.round(isEditing ? editCalories : scanResult?.nutrition?.calories ?? 0)} kcal & +{Math.round(isEditing ? editProtein : scanResult?.nutrition?.protein ?? 0)}g Protein to your daily state.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Synced
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-200/60 dark:border-emerald-700/40 text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Next Best Step For Today:
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {scanResult?.reasoning || "Stay hydrated and hit your daily protein goal."}
              </p>
            </div>

            {/* Quick Action Navigation Grid for the Loop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {(onNavigateToDashboard || onClose) && (
                <button
                  type="button"
                  onClick={onNavigateToDashboard || onClose}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>See Next Best Action</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              )}

              {onNavigateToAdvisor && (
                <button
                  type="button"
                  onClick={onNavigateToAdvisor}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI Health Advisor</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              )}

              {onNavigateToDietPlan && (
                <button
                  type="button"
                  onClick={onNavigateToDietPlan}
                  className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Adaptive Diet Plan</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Another Meal</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom CTA Action Buttons (Reset / Add to Log) */}
        {!savedSuccess && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleReset}
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleSaveToTracker}
              disabled={saving || savedSuccess || !scanResult}
              className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-extrabold transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span>Logging...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Log</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
