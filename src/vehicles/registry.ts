import { renaultClio4 } from './renault-clio-4';
import type { VehicleDefinition } from './types';

/** Every vehicle the app can show, by id. */
export const vehicles: Readonly<Record<string, VehicleDefinition>> = {
  [renaultClio4.id]: renaultClio4,
};

export const defaultVehicle: VehicleDefinition = renaultClio4;
