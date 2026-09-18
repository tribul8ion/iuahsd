import { useCallback, useEffect, useRef, type ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center animate-fade-in"
      style={{
        backgroundColor: "rgba(28, 25, 23, 0.42)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
      }}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="w-full max-w-md bg-white shadow-modal animate-slide-up outline-none"
        style={{
          borderRadius: "28px 28px 0 0",
          maxHeight: "85dvh",
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
        onClick={(e) => e.stopPropagation()}
        onFocusCapture={(e) => {
          const target = e.target;
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            window.setTimeout(() => {
              if (target.isConnected) {
                target.scrollIntoView({ block: "nearest", behavior: "smooth" });
              }
            }, 250);
          }
        }}
      >
        <div className="flex justify-center" style={{ padding: "10px 0 8px 0" }}>
          <div className="rounded-full" style={{ width: 40, height: 5, backgroundColor: "#E7E5E4" }} />
        </div>
        {children}
      </div>
    </div>
  );
}
