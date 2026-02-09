import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionResult {
  block_key: string;
  success: boolean;
  error?: string;
}

interface ActionResultsProps {
  results: ActionResult[];
  isExecuting: boolean;
}

const ActionResults = ({ results, isExecuting }: ActionResultsProps) => {
  if (results.length === 0 && !isExecuting) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 fade-in bg-slate-50 dark:bg-slate-800/50 border-t border-[rgba(165,148,255,0.2)] dark:border-[rgba(165,148,255,0.3)]">
      {isExecuting && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(165,148,255,0.15)] dark:bg-[rgba(165,148,255,0.2)] text-[#A594FF] dark:text-[#A594FF] text-sm font-medium">
          <Loader2 className="w-4 h-4 spinner" />
          <span>Aplicando mudanças...</span>
        </div>
      )}
      {results.map((result, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
            result.success
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          )}
        >
          {result.success ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span className="font-mono text-xs">{result.block_key}</span>
        </div>
      ))}
    </div>
  );
};

export default ActionResults;
