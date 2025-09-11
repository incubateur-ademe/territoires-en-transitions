import { cn } from "@/ui/utils/cn";

/** Affiche une animation pendant le chargement d'un texte */
export function TextPlaceholder({className}: {className?: string}) {
  return (
    <div role="status" className={cn("max-w-sm animate-pulse", className)}>
      <div className="h-2 bg-gray-200 rounded-full w-3/5 mb-4" />
      <div className="h-2 bg-gray-200 rounded-full w-4/5 mb-2.5" />
      <div className="h-2 bg-gray-200 rounded-full w-3/4 mb-2.5" />
      <div className="h-2 bg-gray-200 rounded-full w-3/5 mb-2.5" />
      <span className="sr-only">Chargement en cours...</span>
    </div>
  );
}
