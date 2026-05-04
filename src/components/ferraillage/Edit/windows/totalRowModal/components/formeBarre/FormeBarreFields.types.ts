import type { FormeState } from "../../types";
import type { useFormeBarreBaseState } from "../../hooks/useFormeBarreBaseState";
import type { useSemelleState } from "../../hooks/useSemelleState";
import type { useSlabState } from "../../hooks/useSlabState";
import type { useSlabAutoValues } from "../../hooks/useSlabAutoValues";

export type FormeBarrePatch = (patch: Partial<FormeState>) => void;

export type FormeBarreBaseView = ReturnType<typeof useFormeBarreBaseState>;
export type SemelleView = ReturnType<typeof useSemelleState>;
export type SlabView = ReturnType<typeof useSlabState>;
export type SlabAutoValuesView = ReturnType<typeof useSlabAutoValues>;

