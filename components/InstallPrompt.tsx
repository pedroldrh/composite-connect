"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Download, X } from "lucide-react";

function isPWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
        {num}
      </span>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const platform = useMemo(detectPlatform, []);

  useEffect(() => {
    if (isPWA()) return;

    const dismissed = localStorage.getItem("install-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return;

    const timer = setTimeout(() => setShow(true), 2000);

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  if (!show && !dialogOpen) return null;

  function handleDismiss() {
    localStorage.setItem("install-dismissed", String(Date.now()));
    setShow(false);
  }

  async function handleDirectInstall() {
    if (!deferredPrompt) return;
    (deferredPrompt as unknown as { prompt: () => void }).prompt();
    setDeferredPrompt(null);
    setShow(false);
  }

  return (
    <>
      {show && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="max-w-sm mx-auto bg-card rounded-2xl shadow-lg p-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                className="shrink-0 h-11 w-11 rounded-xl bg-white flex items-center justify-center"
                onClick={() => setDialogOpen(true)}
              >
                <img src="/icon-192.png" alt="CompositeConnect" className="h-8 w-8 rounded-lg" />
              </button>

              <button
                type="button"
                className="flex-1 min-w-0 text-left"
                onClick={() => setDialogOpen(true)}
              >
                <p className="text-sm font-semibold text-foreground">Get the app</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap here for install instructions
                </p>
              </button>

              <button
                onClick={handleDismiss}
                className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {platform !== "ios" && deferredPrompt && (
              <button
                onClick={handleDirectInstall}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm rounded-full py-2.5 hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Install App
              </button>
            )}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Get CompositeConnect
            </DialogTitle>
            <DialogDescription>
              Install the app on your device for quick access — works like a native app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {platform === "ios" && (
              <>
                <Step num={1}>
                  Tap the <strong>share button</strong>{" "}
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">↑</span>{" "}
                  at the bottom of Safari
                </Step>
                <Step num={2}>
                  Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                </Step>
                <Step num={3}>
                  Tap <strong>&quot;Add&quot;</strong> in the top-right corner — done!
                </Step>
                <p className="text-xs text-muted-foreground italic pt-1">
                  On newer iOS, tap the three dots <span className="font-mono text-xs bg-muted px-1 rounded">...</span> at the bottom-right first, then the Share button.
                </p>
              </>
            )}
            {platform === "android" && (
              <>
                <Step num={1}>
                  Tap the <strong>three dots</strong>{" "}
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">⋮</span>{" "}
                  at the top-right of Chrome
                </Step>
                <Step num={2}>
                  Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>
                </Step>
                <Step num={3}>
                  Tap <strong>&quot;Install&quot;</strong> — done!
                </Step>
              </>
            )}
            {platform === "desktop" && (
              <>
                <Step num={1}>
                  Look for the <strong>install icon</strong>{" "}
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">+</span>{" "}
                  in the right side of your address bar
                </Step>
                <Step num={2}>
                  Click it and then click <strong>&quot;Install&quot;</strong> — done!
                </Step>
                <p className="text-xs text-muted-foreground italic pt-1">
                  If you don&apos;t see the icon, open the browser menu and look for &quot;Install CompositeConnect&quot;.
                </p>
              </>
            )}
          </div>

          <DialogFooter>
            <DialogClose>
              <Button className="w-full">Got it</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
