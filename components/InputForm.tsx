"use client";

import { useState, useRef, useCallback } from "react";
import type { UserInput } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Camera, ImageIcon, X } from "lucide-react";

interface InputFormProps {
  onSubmit: (input: UserInput, file: File) => void;
}

export function InputForm({ onSubmit }: InputFormProps) {
  const [university, setUniversity] = useState("");
  const [fraternity, setFraternity] = useState("");
  const [compositeYear, setCompositeYear] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isValid = university.trim() !== "" && fraternity.trim() !== "" && file !== null;

  const handleFile = useCallback((selected: File) => {
    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped && dropped.type.startsWith("image/")) {
        handleFile(dropped);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !file) return;
    onSubmit(
      { university: university.trim(), fraternity: fraternity.trim(), compositeYear: compositeYear.trim() || undefined, image: file },
      file
    );
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              placeholder="e.g. Washington and Lee University"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fraternity">Fraternity</Label>
            <Input
              id="fraternity"
              placeholder="e.g. Kappa Alpha Order"
              value={fraternity}
              onChange={(e) => setFraternity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compositeYear">Composite Year (optional)</Label>
            <Input
              id="compositeYear"
              placeholder="e.g. 2023"
              value={compositeYear}
              onChange={(e) => setCompositeYear(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Composite Photo</Label>

            {!preview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer",
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/40"
                )}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drag and drop your composite image
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    or click to browse files
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse files
                </Button>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-muted/30">
                <img
                  src={preview}
                  alt="Composite preview"
                  className="w-full max-h-48 object-contain"
                />
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate">
                      {file?.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={clearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-1.5" />
                Take a photo
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={!isValid}>
            Analyze Composite
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Upload a fraternity composite photo. We&apos;ll extract names and find
            public profiles.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
