"use client";

import { createContext, use, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Favorite, Outfit } from "@/lib/types";
import { FavoritesDrawer } from "@/components/favorites/FavoritesDrawer";
import { ShareSheet } from "@/components/share/ShareSheet";
import { Toast } from "@/components/ui/Toast";
import { ConfirmDialog, type ConfirmRequest, type ConfirmResult } from "@/components/ui/ConfirmDialog";

/** Options for the in-app confirm/prompt dialog (replaces native confirm/prompt). */
export type ConfirmOptions = Omit<ConfirmRequest, "id">;

interface ChromeContextValue {
  showToast: (message: string) => void;
  openFavorites: () => void;
  /** Open the share sheet for an outfit (renders a card image). */
  openShare: (outfit: Outfit) => void;
  /** Load a saved favorite into the picker preview (navigates to /picker). */
  applyFavorite: (fav: Favorite) => void;
  /** A favorite awaiting the picker to consume it, or null. */
  pendingFavorite: Favorite | null;
  consumePendingFavorite: () => void;
  /** In-app confirmation dialog. Resolves true if confirmed. */
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
  /** In-app text prompt. Resolves the entered string, or null if cancelled. */
  promptText: (opts: ConfirmOptions) => Promise<string | null>;
}

const ChromeContext = createContext<ChromeContextValue | null>(null);

export function useChrome(): ChromeContextValue {
  const ctx = use(ChromeContext);
  if (!ctx) throw new Error("useChrome must be used within <ChromeProvider>");
  return ctx;
}

export function ChromeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [pendingFavorite, setPendingFavorite] = useState<Favorite | null>(null);
  const [shareOutfit, setShareOutfit] = useState<Outfit | null>(null);
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmId = useRef(0);
  const confirmResolver = useRef<((r: ConfirmResult) => void) | null>(null);

  // The React Compiler memoizes these handlers and the context value.
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  };

  const openFavorites = () => setFavoritesOpen(true);
  const openShare = (outfit: Outfit) => setShareOutfit(outfit);

  const applyFavorite = (fav: Favorite) => {
    setPendingFavorite(fav);
    setFavoritesOpen(false);
    router.push("/picker");
  };

  const consumePendingFavorite = () => setPendingFavorite(null);

  const openConfirm = (opts: ConfirmOptions): Promise<ConfirmResult> => {
    confirmId.current += 1;
    setConfirmReq({ ...opts, id: confirmId.current });
    return new Promise<ConfirmResult>((resolve) => {
      confirmResolver.current = resolve;
    });
  };
  const resolveConfirm = (result: ConfirmResult) => {
    setConfirmReq(null);
    const fn = confirmResolver.current;
    confirmResolver.current = null;
    fn?.(result);
  };
  const confirm = async (opts: ConfirmOptions | string): Promise<boolean> => {
    const o = typeof opts === "string" ? { message: opts, danger: true } : opts;
    return (await openConfirm(o)).ok;
  };
  const promptText = async (opts: ConfirmOptions): Promise<string | null> => {
    const r = await openConfirm({ ...opts, withInput: true });
    return r.ok ? (r.value ?? "") : null;
  };

  const value: ChromeContextValue = {
    showToast,
    openFavorites,
    openShare,
    applyFavorite,
    pendingFavorite,
    consumePendingFavorite,
    confirm,
    promptText,
  };

  return (
    <ChromeContext.Provider value={value}>
      {children}
      <FavoritesDrawer
        open={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        onApply={applyFavorite}
        onShare={(fav) => openShare(fav.outfit)}
        onToast={showToast}
      />
      {shareOutfit && <ShareSheet outfit={shareOutfit} onClose={() => setShareOutfit(null)} onToast={showToast} />}
      {confirmReq && (
        <ConfirmDialog key={confirmReq.id} request={confirmReq} onResolve={resolveConfirm} />
      )}
      <Toast message={toast} />
    </ChromeContext.Provider>
  );
}
