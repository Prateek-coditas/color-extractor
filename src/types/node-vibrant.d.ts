declare module 'node-vibrant/node' {
  export interface Swatch {
    rgb: [number, number, number];
    population: number;
  }

  export interface Palette {
    Vibrant?: Swatch;
    Muted?: Swatch;
    DarkVibrant?: Swatch;
    DarkMuted?: Swatch;
    LightVibrant?: Swatch;
    LightMuted?: Swatch;
  }

  export interface VibrantClass {
    from(src: string | Buffer | Uint8Array): VibrantClass;
    getPalette(): Promise<Palette>;
  }

  export const Vibrant: VibrantClass;
}
