import 'i18next';
import type { VehicleLocale } from '../vehicles/types';
import type it from './locales/it.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'ui';
    resources: { ui: typeof it; vehicle: VehicleLocale };
  }
}
