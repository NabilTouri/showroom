// Part ids are English, dotted and hierarchical, with position and side as trailing qualifier
// segments: `hood`, `door.front.left`, `wheel.rear.right`, `headlight.left`.
// A scene part without a card of its own uses the card of its base id plus the qualifiers it
// dropped: `wheel.front.left` -> card `wheel` + [front, left]; `brake.front.left` -> card
// `brake.front` + [left].
import type { PartCardData, PartText, VehicleLocale } from './types';

export const QUALIFIERS = ['front', 'rear', 'left', 'right'] as const;
export type Qualifier = (typeof QUALIFIERS)[number];

const isQualifier = (s: string): s is Qualifier => (QUALIFIERS as readonly string[]).includes(s);

export interface ResolvedPart {
  /** Scene part id. */
  id: string;
  /** Id of the card describing it. */
  cardId: string;
  qualifiers: Qualifier[];
  card: PartCardData;
}

export function resolvePart(
  cards: Readonly<Record<string, PartCardData>>,
  id: string,
): ResolvedPart | null {
  if (cards[id]) return { id, cardId: id, qualifiers: [], card: cards[id] };
  const segments = id.split('.');
  const qualifiers: Qualifier[] = [];
  while (segments.length > 1) {
    const last = segments.pop()!;
    if (!isQualifier(last)) return null;
    qualifiers.unshift(last);
    const cardId = segments.join('.');
    if (cards[cardId]) return { id, cardId, qualifiers, card: cards[cardId] };
  }
  return null;
}

/** Localised qualifier words, agreeing with the card's grammatical gender when the locale needs it. */
export function qualifierWords(
  locale: VehicleLocale,
  text: PartText,
  qualifiers: readonly Qualifier[],
) {
  return qualifiers
    .map((q) => (text.gender && locale.qualifiers[`${q}_${text.gender}`]) || locale.qualifiers[q])
    .join(' ');
}
