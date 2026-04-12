import React from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

type PageItem = number | "...";

interface DotsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
}

export default function DotsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: DotsPaginationProps) {
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
    <div className="flex justify-center items-center gap-3 px-8">
      <button
        type="button"
        disabled={prevDisabled}
        onClick={() => goTo(safeCurrent - 1)}
        className={`flex items-center gap-1 ${
          prevDisabled
            ? "opacity-20 "
            : "text-(--primary) hover:opacity-90"
        }`}
      >
        <FaArrowLeft />
      </button>

      <div className="flex items-center gap-2">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`dots-${idx}`}
              className="flex items-center gap-1 px-1 select-none"
              aria-hidden="true"
            >
              <span className="w-1 h-1 rounded-full bg-(--primary)/50" />
              <span className="w-1 h-1 rounded-full bg-(--primary)/50" />
              <span className="w-1 h-1 rounded-full bg-(--primary)/50" />
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              aria-label={`Aller à la page ${p}`}
              aria-current={safeCurrent === p ? "page" : undefined}
              className={`flex items-center justify-center rounded-full transition-all ${
                safeCurrent === p
                  ? "w-3 h-3 bg-(--primary)"
                  : "w-2.5 h-2.5 bg-(--primary)/35 hover:bg-(--primary)/70"
              }`}
              title={`Page ${p}`}
            />
          )
        )}
      </div>

      <button
        type="button"
        disabled={nextDisabled}
        onClick={() => goTo(safeCurrent + 1)}
        className={`flex items-center gap-1 ${
          nextDisabled
            ? "opacity-20 "
            : "text-(--primary) hover:opacity-90"
        }`}
      >
        <FaArrowRight />
      </button>
    </div>
  );
}