# FFmpeg Frame Extraction - Technical Explanation

## Overview

FFmpeg is used to extract single frames from videos at specific timestamps without downloading the entire video file. It also handles frame resizing during extraction.

---

## How FFmpeg Seeks to a Timestamp

### The `seekInput()` Method

```typescript
ffmpeg(videoUrl)
  .seekInput(timestampSeconds)  // Jump directly to timestamp
```

**What happens internally:**

1. **FFmpeg reads video metadata** (index, keyframes, duration)
2. **Finds the nearest keyframe** before the requested timestamp
3. **Seeks to that keyframe** (fast operation, doesn't decode frames)
4. **Decodes frames sequentially** from keyframe until reaching the exact timestamp
5. **Stops at the target timestamp**

**Why this is efficient:**
- Doesn't download the entire video
- Uses video's internal index to jump directly
- Only decodes frames needed to reach the timestamp
- Works with streaming URLs (HTTP, S3, etc.)

**Example:**
- Video duration: 60 seconds
- Request timestamp: 45 seconds
- FFmpeg seeks directly to ~45 seconds (no need to process 0-44 seconds)

---

## How FFmpeg Extracts a Single Frame

### The `frames(1)` Method

```typescript
ffmpeg(videoUrl)
  .seekInput(timestampSeconds)
  .frames(1)  // Extract only 1 frame
```

**What happens:**

1. After seeking to timestamp, FFmpeg decodes **exactly one frame**
2. Converts frame from video codec format (H.264, VP9, etc.) to raw image data
3. Applies any filters (like scaling) to the frame
4. Encodes frame to output format (JPEG in our case)
5. Writes frame to output file
6. **Stops immediately** (doesn't process remaining video)

**Why `frames(1)` is important:**
- Without it, FFmpeg would process the entire video from that timestamp
- Ensures we only get the frame we need
- Minimizes processing time and memory usage

---

## How the Scale Filter Works

### The `scale=200:-1` Filter

```typescript
.outputOptions([
  '-vf',
  'scale=200:-1',  // Video filter: scale
])
```

**Filter syntax:** `scale=width:height`

**What `scale=200:-1` means:**
- `200` = target width in pixels
- `-1` = auto-calculate height to maintain aspect ratio

**How it works:**

1. **FFmpeg reads the original frame dimensions** (e.g., 1920x1080)
2. **Calculates aspect ratio** (width/height = 1.777...)
3. **Sets width to 200px**
4. **Calculates height:** height = 200 / aspect_ratio = 112px
5. **Resamples pixels** using bilinear interpolation
6. **Outputs resized frame** (200x112 in this example)

**Why `-1` for height:**
- Maintains original aspect ratio
- Prevents distortion (stretching/squashing)
- FFmpeg automatically calculates the correct height

**Alternative examples:**
- `scale=200:200` = Force 200x200 (may distort)
- `scale=-1:200` = Auto width, 200px height
- `scale=200:150` = Fixed 200x150 (may distort)

---

## Why FFmpeg is Used for Resizing (Instead of Sharp)

### Technical Reasons

1. **Single Operation:**
   - FFmpeg extracts AND resizes in one step
   - No need to extract full frame, then resize separately
   - More efficient (one decode/encode cycle)

2. **Memory Efficiency:**
   - Resizes during video decoding
   - Never holds full-resolution frame in memory
   - Only the resized frame exists in memory

3. **Performance:**
   - Hardware acceleration support (GPU)
   - Optimized C code (faster than JavaScript)
   - Single-pass operation

4. **No Additional Dependencies:**
   - FFmpeg is already required for frame extraction
   - Sharp requires native binaries (Node.js version compatibility issues)
   - One tool instead of two

### Comparison

**With Sharp (old approach):**
```
FFmpeg extract frame (1920x1080) → Buffer → Sharp resize → Buffer → Color extraction
```
- Two operations
- Full-resolution frame in memory
- Requires Sharp native binaries

**With FFmpeg only (current approach):**
```
FFmpeg extract + resize (200px width) → Buffer → Color extraction
```
- One operation
- Only resized frame in memory
- No additional dependencies

---

## Complete FFmpeg Command Breakdown

### Full Command Structure

```typescript
ffmpeg(videoUrl)                    // Input: video URL
  .seekInput(timestampSeconds)      // Seek to timestamp
  .frames(1)                        // Extract 1 frame only
  .outputOptions([                  // Output options
    '-vf', 'scale=200:-1',         // Video filter: resize
    '-q:v', '2'                     // JPEG quality (2 = high quality)
  ])
  .output(outputPath)               // Output file path
  .run()                            // Execute
```

### What Each Part Does

1. **`ffmpeg(videoUrl)`**
   - Sets input source (can be URL, file path, or stream)
   - FFmpeg handles HTTP/HTTPS URLs automatically

2. **`.seekInput(timestampSeconds)`**
   - Seeks to specific time position
   - Converts milliseconds to seconds internally

3. **`.frames(1)`**
   - Limits output to 1 frame
   - Stops processing after extracting one frame

4. **`-vf scale=200:-1`**
   - Video filter: scale
   - Resizes frame to 200px width
   - Maintains aspect ratio

5. **`-q:v 2`**
   - JPEG quality setting (1-31, lower = higher quality)
   - `2` = very high quality
   - Ensures color accuracy for color extraction

6. **`.output(outputPath)`**
   - Sets output file path
   - Temporary file (deleted after reading)

7. **`.run()`**
   - Executes the FFmpeg command
   - Returns Promise (via event handlers)

---

## Error Handling

### Common FFmpeg Errors

1. **"Invalid data found when processing input"**
   - URL points to HTML page, not video file
   - Video file is corrupted
   - Unsupported video format

2. **"HTTP error 404"**
   - Video URL not accessible
   - File doesn't exist
   - Access denied

3. **"Cannot find module"**
   - FFmpeg not installed
   - FFmpeg not in system PATH

### How Errors are Handled

- FFmpeg errors are caught in `.on('error')` handler
- Temporary files are cleaned up on error
- Error messages are wrapped and re-thrown with context

---

## Performance Characteristics

### Time Complexity
- **Seek operation:** O(log n) - uses video index
- **Frame extraction:** O(1) - single frame
- **Scaling:** O(w × h) - linear with output size (200px is constant)

### Memory Usage
- **Input:** Streaming (no full video in memory)
- **Processing:** One frame at a time
- **Output:** Single JPEG buffer (~10-50KB)

### Network Usage
- **Seeks directly** to timestamp (doesn't download from start)
- Downloads only necessary video segments
- Efficient for long videos

---

## Summary

FFmpeg handles:
1. ✅ Seeking to exact timestamp (efficient, uses video index)
2. ✅ Extracting single frame (stops after one frame)
3. ✅ Resizing frame (during extraction, maintains aspect ratio)
4. ✅ Encoding to JPEG (high quality for color accuracy)

**Result:** Single JPEG buffer (200px width) ready for color extraction.
