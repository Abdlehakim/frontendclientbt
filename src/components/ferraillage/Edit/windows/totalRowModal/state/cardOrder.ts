import type { Card, ExtraBoxKind, ExtraBoxState, FormeKind, FormeState } from "../types";
import { clamp } from "../utils";

export const ELEMENT_ORDER = ["barre", "cadre", "epingle", "etriers"] as const;
export type ElementOrderType = (typeof ELEMENT_ORDER)[number];

const elementOrderRank = new Map<ElementOrderType, number>(
  ELEMENT_ORDER.map((type, index) => [type, index]),
);

export function elementTypeFromFormeKind(forme: FormeKind | null | undefined): ElementOrderType | null {
  if (!forme) return null;
  return forme === "BARRE" ? "barre" : "cadre";
}

export function elementTypeFromExtraKind(kind: ExtraBoxKind | null | undefined): ElementOrderType | null {
  if (kind === "EPINGLE") return "epingle";
  if (kind === "ETRIERS") return "etriers";
  return null;
}

function getElementOrderRank(type: ElementOrderType | null | undefined) {
  return type ? elementOrderRank.get(type) ?? ELEMENT_ORDER.length : ELEMENT_ORDER.length;
}

export function sortElementsByDropdownOrder<T>(
  elements: readonly T[],
  getType: (element: T) => ElementOrderType | null | undefined,
): T[] {
  return elements
    .map((element, index) => ({ element, index }))
    .sort((a, b) => {
      const byOrder = getElementOrderRank(getType(a.element)) - getElementOrderRank(getType(b.element));
      return byOrder !== 0 ? byOrder : a.index - b.index;
    })
    .map(({ element }) => element);
}

function cardMatches(a: Card, b: Card) {
  return a.kind === b.kind && a.id === b.id;
}

export function sortCardsByDropdownOrder(
  order: readonly Card[],
  extraBoxes: readonly ExtraBoxState[],
  formes: readonly FormeState[],
): Card[] {
  const extraById = new Map(extraBoxes.map((b) => [b.id, b] as const));
  const formeById = new Map(formes.map((f) => [f.id, f] as const));

  return sortElementsByDropdownOrder(order, (card) => {
    if (card.kind === "EXTRA") {
      const extra = extraById.get(card.id);
      return extra ? elementTypeFromExtraKind(extra.kind) : null;
    }

    const forme = formeById.get(card.id);
    return forme ? elementTypeFromFormeKind(forme.forme) : null;
  });
}

export function buildInitialOrder(extraBoxesInit: ExtraBoxState[], formesInit: FormeState[]): Card[] {
  const out: Card[] = [];
  for (const f of formesInit) out.push({ kind: "FORME", id: f.id });
  for (const b of extraBoxesInit) out.push({ kind: "EXTRA", id: b.id });
  return sortCardsByDropdownOrder(out, extraBoxesInit, formesInit);
}

export function insertCardByDropdownOrder(
  order: Card[],
  perPage: number,
  card: Card,
  extraBoxes: ExtraBoxState[],
  formes: FormeState[],
) {
  const nextOrder = sortCardsByDropdownOrder([...order, card], extraBoxes, formes);
  const cardIndex = nextOrder.findIndex((x) => cardMatches(x, card));
  const targetIndex = cardIndex >= 0 ? cardIndex : nextOrder.length - 1;
  const nextTotalPages = Math.max(1, Math.ceil(nextOrder.length / perPage));
  const nextPage = clamp(Math.floor(targetIndex / perPage) + 1, 1, nextTotalPages);

  return { nextOrder, nextPage };
}

