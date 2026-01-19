import { Vibrant } from 'node-vibrant/node';

export class ColorUtil {
  /**
   * Extracts the dominant color from an image buffer using node-vibrant
   * Image buffer is pre-resized by FFmpeg (200px width) for optimal performance
   * @param imageBuffer - Buffer containing image data (resized JPEG from FFmpeg)
   * @returns HEX color string (e.g., "#FF7850")
   */
  static async extractDominantColor(imageBuffer: Buffer): Promise<string> {
    try {
      // Use node-vibrant to extract color palette from image buffer
      const palette = await Vibrant.from(imageBuffer).getPalette();

      // Get the most vibrant/dominant swatch
      // Vibrant swatch is the most saturated, dominant color
      const vibrantSwatch = palette.Vibrant || palette.Muted || palette.DarkVibrant || palette.DarkMuted || palette.LightVibrant || palette.LightMuted;

      if (!vibrantSwatch) {
        throw new Error('No color swatch found in palette');
      }

      // Convert RGB to HEX (node-vibrant provides RGB array [R, G, B])
      const rgb = vibrantSwatch.rgb;
      return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
    } catch (error) {
      throw new Error(`Failed to extract color: ${error.message}`);
    }
  }

  /**
   * Converts RGB values to HEX format
   * @param r - Red value (0-255)
   * @param g - Green value (0-255)
   * @param b - Blue value (0-255)
   * @returns HEX color string (e.g., "#FF7850")
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (value: number) => {
      const hex = Math.round(value).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }
}
