import React from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

type PageItem = number | "...";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
}

export default function TablePagination({ currentPage, totalPages, onPageChange }: TablePaginationProps) {
  const safeTotal = Math.max(totalPages, 1);
  const safeCurrent = Math.min(Math.max(currentPage, 1), safeTotal);

  const goTo = (page: number) => {
    if (page < 1 || page > safeTotal || page === safeCurrent) return;
    onPageChange(page);
  };

  const pages = React.useMemo<PageItem[]>(() => {
    const tp = safeTotal;
    const cp = safeCurrent;
    const out: PageItem[] = [];
    const push = (v: PageItem) => out.push(v);

    if (tp <= 4) {
      for (let i = 1; i <= tp; i++) push(i);
      return out;
    }

    if (cp <= 2) {
      push(1);
      push(2);
      push(3);
      push("...");
      push(tp);
      return out;
    }

    if (cp >= tp - 1) {
      push(1);
      push("...");
      push(tp - 2);
      push(tp - 1);
      push(tp);
      return out;
    }

    push(cp - 1);
    push(cp);
    push(cp + 1);
    push("...");
    push(tp);
    return out;
  }, [safeCurrent, safeTotal]);

  const prevDisabled = safeCurrent <= 1 || safeTotal <= 1;
  const nextDisabled = safeCurrent >= safeTotal || safeTotal <= 1;

  return (
    <div className="flex justify-center items-center gap-2 w-full h-15">
      <button
        type="button"
        disabled={prevDisabled}
        onClick={() => goTo(safeCurrent - 1)}
        className={`flex items-center gap-1 ${
          prevDisabled ? "opacity-20 cursor-not-allowed" : "text-primary hover:opacity-90"
        }`}
      >
        <FaArrowLeft />
        <span className="text-xs font-normal">avant</span>
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`dots-${idx}`} className="text-xs select-none">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => goTo(p)}
            className={`text-xs rounded w-6 h-6 flex justify-center items-center ${
              safeCurrent === p ? "bg-primary text-white" : "text-primary hover:bg-primary/10"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        disabled={nextDisabled}
        onClick={() => goTo(safeCurrent + 1)}
        className={`flex items-center gap-1 ${
          nextDisabled ? "opacity-20 cursor-not-allowed" : "text-primary hover:opacity-90"
        }`}
      >
        <span className="text-xs font-normal">suivant</span>
        <FaArrowRight />
      </button>
    </div>
  );
}
