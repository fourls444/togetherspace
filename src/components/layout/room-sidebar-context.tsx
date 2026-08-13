"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { usePathname } from "next/navigation";

const COMPACT_QUERY = "(max-width: 63.99rem)";

type RoomSidebarContextValue = {
  hasSidebar: boolean;
  isCompact: boolean;
  isOpen: boolean;
  close: () => void;
  registerSidebar: (exists: boolean) => void;
  toggle: () => void;
};

const RoomSidebarContext = createContext<RoomSidebarContextValue | null>(null);

function readCompact() {
  return window.matchMedia(COMPACT_QUERY).matches;
}

export function RoomSidebarProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [hasSidebar, setHasSidebar] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY);
    const sync = () => setIsCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (readCompact()) setOpen(false);
  }, [pathname]);

  const isOpen = open ?? !isCompact;

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    setOpen((current) => {
      const compact = readCompact();
      const next = !(current ?? !compact);
      return next;
    });
  }, []);
  const registerSidebar = useCallback((exists: boolean) => {
    setHasSidebar(exists);
  }, []);

  const value = useMemo(
    () => ({
      close,
      hasSidebar,
      isCompact,
      isOpen,
      registerSidebar,
      toggle,
    }),
    [close, hasSidebar, isCompact, isOpen, registerSidebar, toggle],
  );

  return (
    <RoomSidebarContext.Provider value={value}>
      {children}
    </RoomSidebarContext.Provider>
  );
}

export function useRoomSidebar() {
  const context = useContext(RoomSidebarContext);
  if (!context) {
    throw new Error("useRoomSidebar ต้องอยู่ใน RoomSidebarProvider");
  }
  return context;
}
