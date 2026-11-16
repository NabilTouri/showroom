import 'i18next';
import type { VehicleLocale } from '../vehicles/types';
import type en from './locales/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'ui';
    resources: { ui: typeof en; vehicle: VehicleLocale };
  }
}
