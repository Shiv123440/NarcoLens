import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Maximize2,
  Check,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
} from "lucide-react";
import { MIN_W, MIN_H } from "@/lib/forensics";

export interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  fileName: string;
  onApply: (blob: Blob, dimensions: { width: number; height: number }) => void;
}

type AspectRatioMode = "free" | "4:3" | "16:9" | "1:1";

interface NormalizedCrop {
  x: number; // 0 to 1
  y: number; // 0 to 1
  w: number; // 0 to 1
  h: number; // 0 to 1
}

export function ImageEditorDialog({
  open,
  onOpenChange,
  imageSrc,
  fileName,
  onApply,
}: ImageEditorDialogProps) {
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [scalePercent, setScalePercent] = useState<number>(100); // 50 to 150
  const [aspectMode, setAspectMode] = useState<AspectRatioMode>("free");
  const [crop, setCrop] = useState<NormalizedCrop>({ x: 0, y: 0, w: 1, h: 1 });
  const [activeTab, setActiveTab] = useState<"crop" | "transform" | "resize">("crop");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{
    mode: "move" | "nw" | "ne" | "sw" | "se" | null;
    startX: number;
    startY: number;
    startCrop: NormalizedCrop;
  } | null>(null);

  // Load image element when imageSrc changes or dialog opens
  useEffect(() => {
    if (!open || !imageSrc) {
      setImgElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
      setRotation(0);
      setFlipH(false);
      setScalePercent(100);
      setAspectMode("free");
      setCrop({ x: 0, y: 0, w: 1, h: 1 });
    };
  }, [open, imageSrc]);

  // Rotated bounding box dimensions
  const isPerpendicular = rotation === 90 || rotation === 270;
  const naturalW = imgElement?.naturalWidth ?? 1;
  const naturalH = imgElement?.naturalHeight ?? 1;
  const rotatedW = isPerpendicular ? naturalH : naturalW;
  const rotatedH = isPerpendicular ? naturalW : naturalH;

  // Calculate actual pixel dimensions
  const cropPixelW = Math.round(crop.w * rotatedW);
  const cropPixelH = Math.round(crop.h * rotatedH);
  const finalOutputW = Math.max(1, Math.round(cropPixelW * (scalePercent / 100)));
  const finalOutputH = Math.max(1, Math.round(cropPixelH * (scalePercent / 100)));
  const isValidResolution = finalOutputW >= MIN_W && finalOutputH >= MIN_H;

  // Helper to calculate aspect-constrained crop
  const getAspectCrop = useCallback(
    (mode: AspectRatioMode): NormalizedCrop => {
      if (mode === "free") return { x: 0, y: 0, w: 1, h: 1 };
      const targetRatio = mode === "4:3" ? 4 / 3 : mode === "16:9" ? 16 / 9 : 1;
      const currentRatio = rotatedW / rotatedH;

      let w = 0.92;
      let h = 0.92;
      if (currentRatio > targetRatio) {
        // Image is wider than target
        h = 0.92;
        w = (h * rotatedH * targetRatio) / rotatedW;
      } else {
        // Image is taller than target
        w = 0.92;
        h = (w * rotatedW) / (targetRatio * rotatedH);
      }
      w = Math.min(1, Math.max(0.1, w));
      h = Math.min(1, Math.max(0.1, h));
      const x = (1 - w) / 2;
      const y = (1 - h) / 2;
      return { x, y, w, h };
    },
    [rotatedW, rotatedH]
  );

  const handleSetAspect = (mode: AspectRatioMode) => {
    setAspectMode(mode);
    setCrop(getAspectCrop(mode));
  };

  const handleRotate = (delta: number) => {
    setRotation((prev) => {
      const next = (prev + delta + 360) % 360;
      return next;
    });
    // Reset crop to full on orientation flip for consistency
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
  };

  const handleResetCrop = () => {
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
    setAspectMode("free");
  };

  const handleResetAll = () => {
    setRotation(0);
    setFlipH(false);
    setScalePercent(100);
    setAspectMode("free");
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
  };

  // Draw interactive canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Viewport display dimensions
    const maxDisplayW = 560;
    const maxDisplayH = 340;
    const dispScale = Math.min(maxDisplayW / rotatedW, maxDisplayH / rotatedH, 1);
    const canvasW = Math.round(rotatedW * dispScale);
    const canvasH = Math.round(rotatedH * dispScale);

    canvas.width = canvasW;
    canvas.height = canvasH;

    // 1. Create intermediate canvas with full transformed image
    const intermediate = document.createElement("canvas");
    intermediate.width = rotatedW;
    intermediate.height = rotatedH;
    const ictx = intermediate.getContext("2d");
    if (!ictx) return;

    ictx.save();
    ictx.translate(rotatedW / 2, rotatedH / 2);
    ictx.rotate((rotation * Math.PI) / 180);
    ictx.scale(flipH ? -1 : 1, 1);
    ictx.drawImage(imgElement, -naturalW / 2, -naturalH / 2);
    ictx.restore();

    // 2. Draw base image onto display canvas
    ctx.drawImage(intermediate, 0, 0, canvasW, canvasH);

    // 3. Draw darkened overlay outside crop box
    const cx = crop.x * canvasW;
    const cy = crop.y * canvasH;
    const cw = crop.w * canvasW;
    const ch = crop.h * canvasH;

    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    // Top
    ctx.fillRect(0, 0, canvasW, cy);
    // Bottom
    ctx.fillRect(0, cy + ch, canvasW, canvasH - (cy + ch));
    // Left
    ctx.fillRect(0, cy, cx, ch);
    // Right
    ctx.fillRect(cx + cw, cy, canvasW - (cx + cw), ch);

    // 4. Draw crop rectangle border
    ctx.strokeStyle = "#f59e0b"; // Amber brand color
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // 5. Draw rule-of-thirds grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    // Vertical thirds
    ctx.moveTo(cx + cw / 3, cy);
    ctx.lineTo(cx + cw / 3, cy + ch);
    ctx.moveTo(cx + (cw * 2) / 3, cy);
    ctx.lineTo(cx + (cw * 2) / 3, cy + ch);
    // Horizontal thirds
    ctx.moveTo(cx, cy + ch / 3);
    ctx.lineTo(cx + cw, cy + ch / 3);
    ctx.moveTo(cx, cy + (ch * 2) / 3);
    ctx.lineTo(cx + cw, cy + (ch * 2) / 3);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Draw 4 corner handles
    const handleSize = 9;
    ctx.fillStyle = "#f59e0b";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;

    const corners = [
      { x: cx, y: cy },
      { x: cx + cw, y: cy },
      { x: cx, y: cy + ch },
      { x: cx + cw, y: cy + ch },
    ];

    corners.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, handleSize / 2 + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [imgElement, rotation, flipH, crop, rotatedW, rotatedH]);

  // Pointer event handlers for interactive dragging and resizing
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y, canvasW: canvas.width, canvasH: canvas.height };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const { x, y, canvasW, canvasH } = getCanvasCoords(e);
    const cx = crop.x * canvasW;
    const cy = crop.y * canvasH;
    const cw = crop.w * canvasW;
    const ch = crop.h * canvasH;

    const hitRadius = 18;

    // Check corners
    if (Math.hypot(x - cx, y - cy) <= hitRadius) {
      dragRef.current = { mode: "nw", startX: x, startY: y, startCrop: { ...crop } };
    } else if (Math.hypot(x - (cx + cw), y - cy) <= hitRadius) {
      dragRef.current = { mode: "ne", startX: x, startY: y, startCrop: { ...crop } };
    } else if (Math.hypot(x - cx, y - (cy + ch)) <= hitRadius) {
      dragRef.current = { mode: "sw", startX: x, startY: y, startCrop: { ...crop } };
    } else if (Math.hypot(x - (cx + cw), y - (cy + ch)) <= hitRadius) {
      dragRef.current = { mode: "se", startX: x, startY: y, startCrop: { ...crop } };
    } else if (x >= cx && x <= cx + cw && y >= cy && y <= cy + ch) {
      dragRef.current = { mode: "move", startX: x, startY: y, startCrop: { ...crop } };
    } else {
      dragRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !canvasRef.current) return;
    const { mode, startX, startY, startCrop } = dragRef.current;
    const { x, y, canvasW, canvasH } = getCanvasCoords(e);

    const deltaX = (x - startX) / canvasW;
    const deltaY = (y - startY) / canvasH;

    if (mode === "move") {
      const newX = Math.max(0, Math.min(1 - startCrop.w, startCrop.x + deltaX));
      const newY = Math.max(0, Math.min(1 - startCrop.h, startCrop.y + deltaY));
      setCrop({ ...startCrop, x: newX, y: newY });
    } else if (mode === "se") {
      let newW = Math.max(0.1, Math.min(1 - startCrop.x, startCrop.w + deltaX));
      let newH = Math.max(0.1, Math.min(1 - startCrop.y, startCrop.h + deltaY));

      if (aspectMode !== "free") {
        const ratio = aspectMode === "4:3" ? 4 / 3 : aspectMode === "16:9" ? 16 / 9 : 1;
        newH = (newW * rotatedW) / (ratio * rotatedH);
        if (startCrop.y + newH > 1) {
          newH = 1 - startCrop.y;
          newW = (newH * rotatedH * ratio) / rotatedW;
        }
      }
      setCrop({ ...startCrop, w: newW, h: newH });
    } else if (mode === "nw") {
      let newX = Math.max(0, Math.min(startCrop.x + startCrop.w - 0.1, startCrop.x + deltaX));
      let newY = Math.max(0, Math.min(startCrop.y + startCrop.h - 0.1, startCrop.y + deltaY));
      let newW = startCrop.x + startCrop.w - newX;
      let newH = startCrop.y + startCrop.h - newY;

      if (aspectMode !== "free") {
        const ratio = aspectMode === "4:3" ? 4 / 3 : aspectMode === "16:9" ? 16 / 9 : 1;
        newH = (newW * rotatedW) / (ratio * rotatedH);
        newY = startCrop.y + startCrop.h - newH;
        if (newY < 0) {
          newY = 0;
          newH = startCrop.y + startCrop.h;
          newW = (newH * rotatedH * ratio) / rotatedW;
          newX = startCrop.x + startCrop.w - newW;
        }
      }
      setCrop({ x: Math.max(0, newX), y: Math.max(0, newY), w: newW, h: newH });
    } else if (mode === "ne") {
      let newY = Math.max(0, Math.min(startCrop.y + startCrop.h - 0.1, startCrop.y + deltaY));
      let newW = Math.max(0.1, Math.min(1 - startCrop.x, startCrop.w + deltaX));
      let newH = startCrop.y + startCrop.h - newY;
      setCrop({ ...startCrop, y: newY, w: newW, h: newH });
    } else if (mode === "sw") {
      let newX = Math.max(0, Math.min(startCrop.x + startCrop.w - 0.1, startCrop.x + deltaX));
      let newW = startCrop.x + startCrop.w - newX;
      let newH = Math.max(0.1, Math.min(1 - startCrop.y, startCrop.h + deltaY));
      setCrop({ ...startCrop, x: newX, w: newW, h: newH });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current && canvasRef.current) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  // Generate output blob and invoke onApply
  const handleApply = () => {
    if (!imgElement) return;

    // 1. Full transformed canvas
    const intermediate = document.createElement("canvas");
    intermediate.width = rotatedW;
    intermediate.height = rotatedH;
    const ictx = intermediate.getContext("2d");
    if (!ictx) return;

    ictx.save();
    ictx.translate(rotatedW / 2, rotatedH / 2);
    ictx.rotate((rotation * Math.PI) / 180);
    ictx.scale(flipH ? -1 : 1, 1);
    ictx.drawImage(imgElement, -naturalW / 2, -naturalH / 2);
    ictx.restore();

    // 2. Cropped & scaled output canvas
    const sx = Math.round(crop.x * rotatedW);
    const sy = Math.round(crop.y * rotatedH);
    const sw = Math.round(crop.w * rotatedW);
    const sh = Math.round(crop.h * rotatedH);

    const outCanvas = document.createElement("canvas");
    outCanvas.width = finalOutputW;
    outCanvas.height = finalOutputH;
    const octx = outCanvas.getContext("2d");
    if (!octx) return;

    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(intermediate, sx, sy, sw, sh, 0, 0, finalOutputW, finalOutputH);

    outCanvas.toBlob(
      (blob) => {
        if (blob) {
          onApply(blob, { width: finalOutputW, height: finalOutputH });
          onOpenChange(false);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-4xl p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Crop size={20} className="text-primary" />
                Evidence Photo Studio
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                Crop test wells, correct rotation, or resize photo dimensions before cryptographic sealing.
              </DialogDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isValidResolution
                    ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}
              >
                {isValidResolution ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <AlertTriangle size={13} />
                )}
                {finalOutputW} × {finalOutputH} px
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Studio Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
          {/* Interactive Canvas Viewport */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center bg-zinc-950/90 rounded-xl p-3 border border-border min-h-[300px] sm:min-h-[360px] relative select-none">
            <canvas
              ref={canvasRef}
              className="max-h-[340px] max-w-full rounded shadow-md cursor-crosshair touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label="Interactive image crop canvas. Drag inside box to move, drag corners to resize."
            />
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[0.7rem] text-zinc-400 pointer-events-none">
              <span>Drag corners to resize · Drag box to reposition</span>
              <span>Rotation: {rotation}° {flipH ? "(Flipped)" : ""}</span>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Tabs for feature modes */}
            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                className={`py-1.5 px-2 rounded-md transition-all ${
                  activeTab === "crop"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("crop")}
              >
                Framing
              </button>
              <button
                type="button"
                className={`py-1.5 px-2 rounded-md transition-all ${
                  activeTab === "transform"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("transform")}
              >
                Rotate
              </button>
              <button
                type="button"
                className={`py-1.5 px-2 rounded-md transition-all ${
                  activeTab === "resize"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("resize")}
              >
                Resize
              </button>
            </div>

            {/* Tab 1: Crop & Aspect Ratio */}
            {activeTab === "crop" && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Aspect Framing
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={aspectMode === "4:3" ? "default" : "outline"}
                    className="text-xs justify-start"
                    onClick={() => handleSetAspect("4:3")}
                  >
                    4:3 (NCB 3-Well)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={aspectMode === "1:1" ? "default" : "outline"}
                    className="text-xs justify-start"
                    onClick={() => handleSetAspect("1:1")}
                  >
                    1:1 (Square Well)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={aspectMode === "16:9" ? "default" : "outline"}
                    className="text-xs justify-start"
                    onClick={() => handleSetAspect("16:9")}
                  >
                    16:9 (Landscape)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={aspectMode === "free" ? "default" : "outline"}
                    className="text-xs justify-start"
                    onClick={() => handleSetAspect("free")}
                  >
                    Free Crop
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={handleResetCrop}
                >
                  <Maximize2 size={13} />
                  Fit Full Image
                </Button>
              </div>
            )}

            {/* Tab 2: Rotation & Flip */}
            {activeTab === "transform" && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Orientation
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleRotate(-90)}
                  >
                    <RotateCcw size={14} />
                    Left 90°
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleRotate(90)}
                  >
                    <RotateCw size={14} />
                    Right 90°
                  </Button>
                </div>
                <Button
                  type="button"
                  variant={flipH ? "default" : "outline"}
                  size="sm"
                  className="text-xs mt-1"
                  onClick={() => setFlipH((v) => !v)}
                >
                  <FlipHorizontal size={14} />
                  {flipH ? "Flipped Horizontally" : "Flip Horizontal"}
                </Button>
              </div>
            )}

            {/* Tab 3: Resize & Scale Factor */}
            {activeTab === "resize" && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider">
                    Scale Factor
                  </span>
                  <span className="font-mono font-bold text-primary">
                    {scalePercent}%
                  </span>
                </div>
                <Slider
                  min={50}
                  max={150}
                  step={5}
                  value={[scalePercent]}
                  onValueChange={(val) => setScalePercent(val[0] ?? 100)}
                />
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {[50, 75, 100, 125].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={scalePercent === preset ? "default" : "outline"}
                      size="sm"
                      className="text-xs px-1"
                      onClick={() => setScalePercent(preset)}
                    >
                      {preset}%
                    </Button>
                  ))}
                </div>
                <p className="text-[0.7rem] text-muted-foreground mt-2 leading-relaxed">
                  Scaling adjusts output file dimensions. Minimum forensic standard is {MIN_W} × {MIN_H} px.
                </p>
              </div>
            )}

            {/* Forensic Resolution Card */}
            <div className="mt-auto border border-line rounded-lg p-3 bg-card text-xs flex flex-col gap-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Original Dimensions:</span>
                <span className="font-mono">{rotatedW} × {rotatedH} px</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground">Output Dimensions:</span>
                <span className={`font-mono ${isValidResolution ? "text-primary font-bold" : "text-destructive font-bold"}`}>
                  {finalOutputW} × {finalOutputH} px
                </span>
              </div>
              {!isValidResolution && (
                <p className="text-[0.7rem] text-destructive flex items-center gap-1 mt-1 leading-tight">
                  <AlertTriangle size={12} className="shrink-0" />
                  Below NCB minimum forensic standard ({MIN_W} × {MIN_H} px).
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-line">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            className="text-xs text-muted-foreground"
          >
            <RefreshCw size={13} />
            Reset all adjustments
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isValidResolution}
            onClick={handleApply}
            className="gap-1.5"
          >
            <Check size={14} />
            Apply & Update Evidence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
