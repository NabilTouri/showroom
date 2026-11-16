// The contract between the generic viewer/UI and a vehicle. A vehicle is a TypeScript module
// that exports a `VehicleDefinition` (checked with `satisfies`) and is listed in the registry.
import type * as THREE from 'three';
import type { CarPaint, PaintColor } from '../viewer/car-paint';
import type { Vec3 } from '../viewer/math';

export type { Vec3 };
export type Axis = 'x' | 'y' | 'z';
export type Language = 'en' | 'it';

// ---------- Scene built by the vehicle ----------

/** A panel that rotates open around a hinge (the object's origin). */
export interface Openable {
  object: THREE.Object3D;
  axis: Axis;
  /** Rotation in radians when fully open. */
  angle: number;
}

/** What `VehicleDefinition.build` returns. Coordinates are relative to `BuildContext.root`. */
export interface VehicleBuild {
  /** Scene parts by part id (see part-cards.ts for the id scheme). Parts may be nested. */
  parts: Record<string, THREE.Object3D>;
  openables: Record<string, Openable>;
  /** Offset of each explodable part in the exploded view. */
  explode: Record<string, THREE.Vector3>;
  /** Materials by key, as referenced by `materialRoles` and `lights.emission`. */
  materials: Record<string, THREE.Material>;
  paint: CarPaint;
}

export interface BuildContext {
  /** Group the vehicle builds into; already placed in the scene. */
  root: THREE.Group;
}

// ---------- Presentation ----------

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  /** The camera distance is scaled by max(1, fit / aspect) so narrow screens still frame it. */
  fit: number;
}

export interface CameraView extends CameraPose {
  id: string;
  /** Openables opened when this view is chosen. */
  opens?: readonly string[];
}

export type PaintFinish = 'solid' | 'metallic' | 'pearl';

export interface PaintOption extends PaintColor {
  id: string;
  /** Manufacturer's colour name (a proper name: not translated). */
  name: string;
  finish: PaintFinish;
}

export interface LightSwitch {
  id: string;
  on?: boolean;
  /** Blinks while on (hazard lights). */
  blinking?: boolean;
}

export type LightState = Readonly<Record<string, boolean>>;

export interface LightRig {
  switches: readonly LightSwitch[];
  /** Blink frequency of blinking switches (half-periods per second). */
  blinkRate: number;
  /** Emissive intensity of each material key for a light state. */
  emission: Readonly<Record<string, (state: LightState, blink: boolean) => number>>;
  /** Additive glow on the floor in front of the vehicle while `switch` is on. */
  floorBeam?: { switch: string; position: Vec3; size: readonly [number, number]; opacity: number };
}

/** Studio spotlight (world coordinates) that fades in as an openable opens. */
export interface Spotlight {
  color: number;
  intensity: number;
  distance: number;
  angle: number;
  penumbra: number;
  decay: number;
  position: Vec3;
  target: Vec3;
  followsOpenable: string;
}

export interface MaterialRoles {
  /** Body paint (colour menu). */
  paint: string;
  /** Materials made see-through in x-ray mode, with their x-ray opacity. */
  xray: Readonly<Record<string, number>>;
  /** Materials that never stop a pick (glass, lenses). */
  pickThrough: readonly string[];
}

// ---------- Part cards ----------

export interface OemReference {
  code: string;
  /** The code must be checked against the VIN before ordering. */
  verify: boolean;
}

/** Language-independent data of a part card; texts live in the vehicle locales. */
export interface PartCardData {
  category: string;
  /** OEM references, aligned by index with `PartText.oem` labels. */
  oem?: readonly OemReference[];
}

/** [label, value] */
export type SpecRow = string[];

export interface PartText {
  name: string;
  /** Grammatical gender, for languages whose qualifiers agree with the noun (`left_female`). */
  gender?: string;
  description: string;
  where?: string;
  specs?: SpecRow[];
  maintenance?: string[];
  faults?: string[];
  oem?: string[];
}

export interface VehicleLocale {
  /** Subtitle under the brand name in the top bar. */
  subtitle: string;
  card: { intro: string; specs: SpecRow[]; note: string; credits: string };
  /** Disclaimer shown under every part card. */
  partNote: string;
  categories: Record<string, string>;
  views: Record<string, string>;
  openables: Record<string, string>;
  lights: Record<string, string>;
  /** Part id qualifiers (front, rear, left, right), optionally `<qualifier>_<gender>`. */
  qualifiers: Record<string, string>;
  parts: Record<string, PartText>;
}

// ---------- Definition ----------

export interface VehicleDefinition {
  id: string;
  /** Full name, e.g. on the vehicle card. */
  name: string;
  /** Name used in the document title. */
  shortName: string;
  /** Name shown in the top bar. */
  brand: string;
  /** Manufacturer, for OEM part numbers. */
  make: string;
  /** Overall length (m): the vehicle is centred on it. */
  length: number;
  build(context: BuildContext): Promise<VehicleBuild>;
  materialRoles: MaterialRoles;

  views: readonly CameraView[];
  defaultView: string;
  explode: {
    view: CameraPose;
    /** Openables opened when exploding or when an explodable part is selected. */
    opens: readonly string[];
    /** Direction used to frame an explodable part (z is mirrored for parts on the right). */
    focusDirection: Vec3;
  };
  /** Openables in menu order. */
  openables: readonly string[];
  paints: readonly PaintOption[];
  defaultPaint: string;
  lights: LightRig;
  spotlights: readonly Spotlight[];

  /** Part list categories, in order. */
  categories: readonly string[];
  /** Category expanded in the part list at start. */
  initialCategory: string;
  /** Categories that x-ray picking sees through (body panels, glass). */
  xrayPassThroughCategories: readonly string[];
  cards: Readonly<Record<string, PartCardData>>;
  locales: Readonly<Record<Language, VehicleLocale>>;
  credits: { authorUrl: string; licenseUrl: string };
}
