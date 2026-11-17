import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { qualifierWords, resolvePart } from '../vehicles/part-cards';
import type { Language, VehicleDefinition } from '../vehicles/types';

/** Texts of the vehicle in the current UI language. */
export function useVehicleLocale(vehicle: VehicleDefinition) {
  const { i18n } = useTranslation();
  return vehicle.locales[i18n.resolvedLanguage as Language] ?? vehicle.locales.en;
}

/** Resolves a scene part to its card, with texts and display name in the current language. */
export function usePartCard(vehicle: VehicleDefinition) {
  const { t } = useTranslation();
  const locale = useVehicleLocale(vehicle);
  return useCallback(
    (id: string) => {
      const part = resolvePart(vehicle.cards, id);
      if (!part) return null;
      const text = locale.parts[part.cardId];
      const qualifiers = qualifierWords(locale, text, part.qualifiers);
      const name = qualifiers ? t('partName', { name: text.name, qualifiers }) : text.name;
      return { ...part, text, name };
    },
    [vehicle, locale, t],
  );
}

export type PartCardView = NonNullable<ReturnType<ReturnType<typeof usePartCard>>>;
