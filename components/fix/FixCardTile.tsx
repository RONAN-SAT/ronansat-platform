import { AlertTriangle, Check, ChevronDown, ChevronUp, GripVertical } from "lucide-react";

import type { FixCard } from "@/components/fix/FixBoardProvider";

type FixCardTileProps = {
  card: FixCard;
  expanded?: boolean;
  draggable?: boolean;
  showDetails?: boolean;
  onToggleExpanded?: () => void;
  onResolve?: () => void;
  onDragStart?: (cardId: string) => void;
};

export function FixCardTile({
  card,
  expanded = false,
  draggable = false,
  showDetails = false,
  onToggleExpanded,
  onResolve,
  onDragStart,
}: FixCardTileProps) {
  return (
    <article
      draggable={draggable}
      onDragStart={() => onDragStart?.(card.id)}
      className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(148,163,184,0.12)]"
    >
      <div className="flex items-start gap-3">
        {draggable ? <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[14px] font-semibold leading-5 text-slate-900">{card.text}</div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {card.reportCount} reports
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{card.section}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">Module {card.module}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">Question {card.questionNumber}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {showDetails ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {expanded ? "Hide details" : "Show details"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        ) : null}

        {onResolve ? (
          <button
            type="button"
            onClick={onResolve}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Check className="h-3.5 w-3.5" />
            Mark fixed
          </button>
        ) : null}
      </div>

      {showDetails && expanded ? (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          {card.reports.map((report, index) => (
            <div key={report.id} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="rounded-full bg-white px-2 py-0.5 font-medium text-slate-700">#{card.reportCount - index}</span>
                <span>{report.errorType}</span>
                <span>{report.source === "review" ? "From review" : "From test"}</span>
                <span>{new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-[13px] leading-5 text-slate-700">
                {report.note?.trim() ? report.note : "No extra note provided."}
              </div>
              {report.reporterName || report.reporterEmail ? (
                <div className="mt-1 text-[11px] text-slate-400">{report.reporterName || report.reporterEmail}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
