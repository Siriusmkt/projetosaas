import { memo } from "react";
import { cn } from "@/lib/utils";

type FlowPreviewBlock = {
  block_key: string;
  block_type: string;
  content_preview?: string;
  content?: string;
  order_index?: number;
};

const TYPE_CLASS: Record<string, string> = {
  mensagem: "mensagem",
  primeira_mensagem: "mensagem",
  aguardar: "aguardar",
  caminhos: "caminhos",
  encerrar: "encerrar",
  ferramenta: "ferramenta",
};

export const FlowPreviewInChat = memo(function FlowPreviewInChat({
  blocos,
  onBlocoClick,
}: {
  blocos: FlowPreviewBlock[];
  onBlocoClick?: (bloco: FlowPreviewBlock) => void;
}) {
  const sorted = [...blocos].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  return (
    <div className="mt-3 rounded-xl border border-[rgba(165,148,255,0.2)] bg-[rgba(165,148,255,0.06)] p-3">
      <div className="text-xs font-semibold text-[#A594FF] mb-2">Fluxo visual</div>
      <div className="flex flex-col gap-2">
        {sorted.map((b, idx) => {
          const cls = TYPE_CLASS[b.block_type] || "config";
          return (
            <div key={`${b.block_key}-${idx}`} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onBlocoClick?.(b)}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2 bg-[rgba(30,30,46,0.75)] hover:bg-[rgba(165,148,255,0.12)] transition-colors",
                  "border-l-4",
                  cls === "mensagem" && "border-l-blue-500",
                  cls === "aguardar" && "border-l-amber-500",
                  cls === "caminhos" && "border-l-emerald-500",
                  cls === "encerrar" && "border-l-red-500",
                  cls === "ferramenta" && "border-l-orange-500",
                  cls === "config" && "border-l-[#A594FF]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold text-[#A594FF]">
                    {b.block_key} • {b.block_type}
                  </div>
                  <div className="text-[10px] text-slate-400">Clique para focar</div>
                </div>
                <div className="mt-1 text-xs text-slate-300 line-clamp-2 whitespace-pre-wrap">
                  {b.content_preview || (b.content ? b.content.slice(0, 180) : "")}
                </div>
              </button>
              {idx < sorted.length - 1 && (
                <div className="flex justify-center text-[12px] text-[rgba(165,148,255,0.45)]">↓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

