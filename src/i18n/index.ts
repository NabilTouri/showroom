// UI translations (i18next). Vehicle texts are registered per vehicle under the `vehicle`
// namespace (see registerVehicleTexts).
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { VehicleDefinition } from '../vehicles/types';
import it from './locales/it.json';

export const resources = { it: { ui: it } } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'it',
  fallbackLng: 'it',
  ns: ['ui'],
  defaultNS: 'ui',
  interpolation: { escapeValue: false }, // React escapes
});

export function registerVehicleTexts(vehicle: VehicleDefinition) {
  for (const [lng, texts] of Object.entries(vehicle.locales))
    i18n.addResourceBundle(lng, 'vehicle', texts, true, true);
}

export default i18n;
