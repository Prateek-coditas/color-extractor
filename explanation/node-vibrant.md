# node-vibrant Color Extraction - Technical Explanation

## Overview

node-vibrant extracts dominant colors from images using Google's Material Design color extraction algorithm. It analyzes image data to find the most representative colors.

---

## How node-vibrant Analyzes an Image

### Input Processing

```typescript
const palette = await Vibrant.from(imageBuffer).getPalette();
```

**What happens:**

1. **Image Buffer Input:**
   - Receives JPEG/PNG image buffer (from FFmpeg)
   - Decodes image to raw pixel data
   - Gets image dimensions and color channels (RGB/RGBA)

2. **Image Quantization:**
   - Reduces color space complexity
   - Groups similar colors together
   - Creates color clusters (not pixel-by-pixel analysis)

3. **Palette Generation:**
   - Analyzes color clusters
   - Calculates color statistics (saturation, lightness, population)
   - Generates multiple color swatches

---

## High-Level Algorithm Explanation

### Color Quantization (Not Brute Force)

**What it does NOT do:**
- ❌ Count every pixel individually
- ❌ Simple average of all pixels
- ❌ Most frequent pixel color

**What it DOES do:**
- ✅ **Color Clustering:** Groups similar colors together
- ✅ **Statistical Analysis:** Analyzes color distribution
- ✅ **Material Design Algorithm:** Uses Google's color extraction method

### The Process

1. **Color Space Reduction:**
   - Reduces 16.7 million possible colors (24-bit RGB) to manageable clusters
   - Uses quantization to group similar colors
   - Example: #FF0000, #FE0000, #FF0100 → grouped as "red cluster"

2. **Cluster Analysis:**
   - Calculates properties for each cluster:
     - **Population:** How many pixels belong to this cluster
     - **Saturation:** How vibrant/pure the color is
     - **Lightness:** How bright/dark the color is

3. **Swatch Selection:**
   - Selects colors based on Material Design principles:
     - **Vibrant:** High saturation, good contrast
     - **Muted:** Lower saturation, balanced
     - **Dark/Light variants:** Adjusted for different contexts

---

## What is a Palette?

### Palette Structure

A palette is an object containing multiple color swatches:

```typescript
{
  Vibrant: { rgb: [255, 120, 80], population: 1500 },
  Muted: { rgb: [180, 150, 140], population: 2000 },
  DarkVibrant: { rgb: [100, 50, 30], population: 800 },
  DarkMuted: { rgb: [80, 70, 60], population: 1200 },
  LightVibrant: { rgb: [255, 200, 180], population: 600 },
  LightMuted: { rgb: [220, 210, 200], population: 900 }
}
```

### Swatch Properties

Each swatch contains:
- **`rgb`:** Array `[R, G, B]` with values 0-255
- **`population`:** Number representing how dominant this color is

### Why Multiple Swatches?

Material Design provides multiple color options for different UI contexts:
- **Vibrant:** For accents, buttons (eye-catching)
- **Muted:** For backgrounds (subtle)
- **Dark/Light:** For text, overlays (contrast)

---

## How the Dominant Color is Selected

### Selection Priority

```typescript
const vibrantSwatch = 
  palette.Vibrant ||           // 1st priority: Most vibrant
  palette.Muted ||             // 2nd priority: Balanced
  palette.DarkVibrant ||       // 3rd priority: Dark variant
  palette.DarkMuted ||         // 4th priority: Dark balanced
  palette.LightVibrant ||      // 5th priority: Light variant
  palette.LightMuted;          // 6th priority: Light balanced
```

**Why this order:**

1. **Vibrant first:** Most eye-catching, represents the "essence" of the image
2. **Muted second:** If vibrant is too extreme, muted provides balance
3. **Dark/Light variants:** Fallbacks if primary swatches aren't available

**Example:**
- Image: Sunset photo (orange/red dominant)
- Vibrant: Bright orange (#FF7850) ← Selected
- Muted: Softer orange (#E8A080)
- Result: #FF7850 (most vibrant)

---

## Why HEX Format is Returned

### HEX Format

**Format:** `#RRGGBB` (e.g., `#FF7850`)

**Why HEX:**
- **Standard web format:** Used in CSS, HTML, design tools
- **Human-readable:** Easy to understand and communicate
- **Compact:** 7 characters vs. "rgb(255, 120, 80)"
- **Universal:** Works across platforms and tools

### Conversion Process

```typescript
RGB [255, 120, 80] → HEX "#FF7850"
```

**Steps:**
1. Convert each RGB value (0-255) to hexadecimal (00-FF)
2. Combine: `FF` + `78` + `50`
3. Add `#` prefix
4. Convert to uppercase

**Example:**
- R: 255 → `FF`
- G: 120 → `78`
- B: 80 → `50`
- Result: `#FF7850`

---

## Why 200px Width is Optimal

### Image Size Considerations

**Too small (< 100px):**
- Not enough pixels for accurate analysis
- Color quantization loses detail
- Less accurate color extraction

**Too large (> 500px):**
- More processing time
- Diminishing returns on accuracy
- Unnecessary memory usage

**200px width:**
- ✅ Sufficient pixels for accurate analysis
- ✅ Fast processing
- ✅ Good balance of accuracy and performance
- ✅ Recommended by node-vibrant documentation

### Why Width, Not Height?

- Width is more consistent across different aspect ratios
- Height varies (16:9 vs 4:3 vs 1:1)
- 200px width ensures consistent processing time

---

## Algorithm Deep Dive (Simplified)

### Step-by-Step Process

1. **Image Decoding:**
   ```
   JPEG Buffer → Raw Pixel Data (RGB values)
   ```

2. **Color Quantization:**
   ```
   Raw Pixels → Color Clusters (grouped by similarity)
   ```

3. **Cluster Analysis:**
   ```
   Clusters → Statistics (population, saturation, lightness)
   ```

4. **Swatch Generation:**
   ```
   Statistics → Material Design Swatches (Vibrant, Muted, etc.)
   ```

5. **Selection:**
   ```
   Swatches → Dominant Swatch (Vibrant priority)
   ```

6. **Format Conversion:**
   ```
   RGB Array → HEX String
   ```

---

## Performance Characteristics

### Time Complexity
- **Image decoding:** O(w × h) - linear with image size
- **Quantization:** O(w × h × k) - k = number of clusters (optimized)
- **Swatch generation:** O(k) - k = number of clusters

### Memory Usage
- **Input buffer:** ~10-50KB (200px JPEG)
- **Processing:** Temporary pixel data
- **Output:** Single RGB array [R, G, B]

### Processing Time
- **200px image:** ~50-200ms
- **Depends on:** Image complexity, color variety

---

## Why node-vibrant (Not Other Libraries)

### Advantages

1. **Material Design Algorithm:**
   - Proven algorithm used by Google
   - Designed for UI/UX applications
   - Provides multiple color variants

2. **Works with Buffers:**
   - No file system needed
   - Direct buffer input/output
   - Perfect for our pipeline

3. **Pure JavaScript:**
   - No native dependencies
   - No Python/C++ compilation
   - Works across platforms

4. **Production Ready:**
   - Actively maintained
   - Used by many production apps
   - Well-tested

---

## Summary

node-vibrant:
1. ✅ Receives image buffer (200px JPEG from FFmpeg)
2. ✅ Quantizes colors into clusters (not pixel-by-pixel)
3. ✅ Analyzes clusters using Material Design algorithm
4. ✅ Generates color palette (Vibrant, Muted, Dark, Light variants)
5. ✅ Selects dominant swatch (Vibrant priority)
6. ✅ Converts RGB to HEX format

**Result:** Single HEX color string (e.g., `#FF7850`) representing the dominant color.
