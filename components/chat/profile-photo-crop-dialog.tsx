"use client";

import React, { useCallback, useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

async function getCroppedImageDataUrl(imageSrc: string, pixelCrop: Area, maxSide = 512): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const sx = pixelCrop.x * scaleX;
  const sy = pixelCrop.y * scaleY;
  const sw = pixelCrop.width * scaleX;
  const sh = pixelCrop.height * scaleY;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, pixelCrop.width, pixelCrop.height);

  let w = canvas.width;
  let h = canvas.height;
  if (w > maxSide || h > maxSide) {
    const f = maxSide / Math.max(w, h);
    w = Math.round(w * f);
    h = Math.round(h * f);
    const c2 = document.createElement("canvas");
    c2.width = w;
    c2.height = h;
    const c2x = c2.getContext("2d");
    if (!c2x) throw new Error("Canvas not supported");
    c2x.imageSmoothingQuality = "high";
    c2x.drawImage(canvas, 0, 0, w, h);
    return c2.toDataURL("image/jpeg", 0.92);
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

type ProfilePhotoCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropComplete: (dataUrl: string) => void;
};

export function ProfilePhotoCropDialog({ open, onOpenChange, imageSrc, onCropComplete }: ProfilePhotoCropDialogProps) {
  const { toast } = useToast();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open, imageSrc]);

  const onCropCompleteInternal = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const dataUrl = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels);
      onCropComplete(dataUrl);
      onOpenChange(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Could not crop image",
        description: "Try another photo or a smaller file.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Crop profile photo</DialogTitle>
        </DialogHeader>
        {imageSrc ? (
          <div className="space-y-4">
            <div className="relative h-64 w-full overflow-hidden rounded-xl bg-muted">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteInternal}
              />
            </div>
            <div className="space-y-2 px-0.5">
              <p className="text-[10px] font-medium text-muted-foreground">Zoom</p>
              <Slider value={[zoom]} min={1} max={3} step={0.02} onValueChange={(v) => setZoom(v[0] ?? 1)} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="button" className="flex-1" onClick={() => void handleApply()} disabled={busy || !croppedAreaPixels}>
                {busy ? "Saving…" : "Apply crop"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
