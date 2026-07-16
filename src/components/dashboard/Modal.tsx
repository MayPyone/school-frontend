import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className={cn("flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900")}>
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
