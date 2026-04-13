import type { Card, ExtraBoxState, FormeState } from "../types";
import { clamp } from "../utils";

export function buildInitialOrder(extraBoxesInit: ExtraBoxState[], formesInit: FormeState[]): Card[] {
  const out: Card[] = [];
  for (const b of extraBoxesInit) out.push({ kind: "EXTRA", id: b.id });
  for (const f of formesInit) out.push({ kind: "FORME", id: f.id });
  return out;
}

export function insertCardAtEndOfCurrentPage(order: Card[], page: number, perPage: number, card: Card) {
  const prevTotalPages = Math.max(1, Math.ceil(order.length / perPage));
  const currentPage = clamp(page, 1, prevTotalPages);

  const currentStart = (currentPage - 1) * perPage;
  const currentCount = order.slice(currentStart, currentStart + perPage).length;

  const insertIndex = currentStart + currentCount;
  const nextOrder = [...order.slice(0, insertIndex), card, ...order.slice(insertIndex)];

  const nextTotalPages = Math.max(1, Math.ceil(nextOrder.length / perPage));
  const nextPage = clamp(Math.floor(insertIndex / perPage) + 1, 1, nextTotalPages);

  return { nextOrder, nextPage };
}

