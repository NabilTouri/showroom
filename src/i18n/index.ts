// UI translations (i18next). English is the default; the user's choice is remembered in
// localStorage. Vehicle texts are registered per vehicle under the `vehicle` namespace.
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import type { Language, VehicleDefinition } from '../vehicles/types';
import en from './locales/en.json';
import it from './locales/it.json';

export const LANGUAGES = ['en', 'it'] as const satisfies readonly Language[];

export const resources = { en: { ui: en }, it: { ui: it } } as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: LANGUAGES,
    fallbackLng: 'en',
    ns: ['ui'],
    defaultNS: 'ui',
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'showroom.language',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false }, // React escapes
  });

const setDocumentLanguage = (lng: string) => document.documentElement.setAttribute('lang', lng);
setDocumentLanguage(i18n.resolvedLanguage ?? 'en');
i18n.on('languageChanged', setDocumentLanguage);

export function registerVehicleTexts(vehicle: VehicleDefinition) {
  for (const [lng, texts] of Object.entries(vehicle.locales))
    i18n.addResourceBundle(lng, 'vehicle', texts, true, true);
}

export default i18n;
