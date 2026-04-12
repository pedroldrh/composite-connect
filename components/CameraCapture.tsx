"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ArrowLeft } from "lucide-react";

interface CameraCaptureProps {
  university: string;
  onCapture: (file: File) => void;
  onBack: () => void;
}

export function CameraCapture({
  university,
  onCapture,
  onBack,
}: CameraCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  function handleFile(selected: File | undefined) {
    if (!selected) return;
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  }

  function handleContinue() {
    if (file) onCapture(file);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-sm text-muted-foreground">{university}</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Take a photo of the composite
          </h1>
        </div>

        {/* Capture area */}
        {preview ? (
          <div className="w-full overflow-hidden rounded-xl bg-muted/10">
            <img
              src={preview}
              alt="Composite preview"
              className="w-full h-auto rounded-xl"
            />
          </div>
        ) : (
          <div
            className="relative mx-auto w-full overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20"
            style={{ aspectRatio: "4/3" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-muted-foreground/50" />
              <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-muted-foreground/50" />
              <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-muted-foreground/50" />
              <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-muted-foreground/50" />
              <p className="px-8 text-center text-sm text-muted-foreground">
                Point camera at the composite
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1 h-10"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" data-icon="inline-start" />
            Take Photo
          </Button>
          <Button
            variant="secondary"
            className="flex-1 h-10"
            onClick={() => uploadInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" data-icon="inline-start" />
            Upload Image
          </Button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {/* Continue button */}
        {file && (
          <Button
            className="w-full h-10"
            onClick={handleContinue}
          >
            Continue
          </Button>
        )}

        {/* Back button */}
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" data-icon="inline-start" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
