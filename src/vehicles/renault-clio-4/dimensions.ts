/** Main dimensions in vehicle coordinates (m): x from the front bumper, y up, z to the left. */
export interface ClioDimensions {
  length: number;
  frontAxle: number;
  /** Wheelbase 2.589 m. */
  rearAxle: number;
  wheelCenterY: number;
  /** Half of the track width. */
  halfTrack: number;
}
