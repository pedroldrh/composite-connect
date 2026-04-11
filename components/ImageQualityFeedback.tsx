"use client";

import type { ImageQualityResult } from "@/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Sun, Maximize } from "lucide-react";

interface ImageQualityFeedbackProps {
  result: ImageQualityResult;
  onContinue: () => void;
  onRetake: () => void;
}

const warningIcons: Record<string, React.ReactNode> = {
  blur: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  brightness: <Sun className="h-4 w-4 text-amber-500" />,
  resolution: <Maximize className="h-4 w-4 text-amber-500" />,
  size: <Maximize className="h-4 w-4 text-amber-500" />,
};

export function ImageQualityFeedback({
  result,
  onContinue,
  onRetake,
}: ImageQualityFeedbackProps) {
  const { pass, warnings, metrics } = result;

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {pass && warnings.length === 0 ? (
        <Alert className="bg-emerald-500/10 border-emerald-500/20">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <AlertTitle className="text-emerald-400">
            Image quality looks good
          </AlertTitle>
          <AlertDescription>
            Your composite image meets all quality requirements.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {warnings.map((warning, i) => (
            <Alert key={i} className="bg-amber-500/10 border-amber-500/20">
              {warningIcons[warning.type]}
              <AlertTitle className="text-amber-400">{warning.message}</AlertTitle>
              <AlertDescription>{warning.suggestion}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {metrics.width}&times;{metrics.height} ({metrics.megapixels.toFixed(1)} MP)
        &middot; Brightness: {Math.round(metrics.brightness)}/255 &middot; Sharpness:{" "}
        {Math.round(metrics.blurScore)}
      </p>

      <div className="flex gap-3 justify-center">
        {pass && warnings.length === 0 ? (
          <Button onClick={onContinue} size="lg">
            Continue
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onContinue}>
              Continue Anyway
            </Button>
            <Button onClick={onRetake}>Retake Photo</Button>
          </>
        )}
      </div>
    </div>
  );
}
