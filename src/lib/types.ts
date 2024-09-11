export type Output<T> = "Aborted" | "SelectedNone" | { Selected: T };
export type Selected<T> = T extends { Selected: infer U } ? U : never;

export interface Surface {
  surface_type: "Window" | "Display";
  id: number;
  title: string;
  program: string;
  thumbnail: string;
}
export type SurfaceOutput = Output<{ title: string; thumbnail: string }>;

export interface AudioDevice {
  name: string;
  id: number;
}
export type AudioDeviceOutput = Output<string>;
