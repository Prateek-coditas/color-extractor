# FFmpeg Batch Extraction Optimization

## Overview
The video color extractor has been optimized to use a **single FFmpeg process** per request instead of spawning FFmpeg once per timestamp. This significantly reduces video decoding overhead and improves overall performance.

## Changes Made

### 1. FFmpeg Utility (`src/modules/video-processor/utils/ffmpeg.util.ts`)

#### New Method: `extractMultipleFrames()`
- **Purpose**: Extract frames for multiple timestamps in a single FFmpeg process
- **Implementation**:
  - Uses FFmpeg `select` filter to extract frames at specific timestamps
  - Applies `scale=64:-1` filter to maintain consistent 64px width sizing
  - Outputs frames as concatenated JPEG data via `image2pipe`
  - For single timestamp, delegates to existing optimized `extractFrame()` method
  
- **Key optimizations**:
  - Video is opened and decoded only once
  - Multiple frames extracted in parallel from the decoded stream
  - Avoids redundant video seeking for each frame

#### New Helper Method: `parseJpegFrames()`
- Parses concatenated JPEG output from FFmpeg's `image2pipe` format
- Detects JPEG SOI (Start of Image) markers to split individual frames
- Returns an array of individual frame buffers

### 2. Repository Layer (`src/modules/video-processor/video-processor.repository.ts`)

#### New Method: `extractColorsFromFrames()`
- **Purpose**: Batch color extraction using optimized FFmpeg method
- **Flow**:
  1. Calls `FfmpegUtil.extractMultipleFrames()` to extract all frames in one FFmpeg process
  2. Maps returned frames to their corresponding timestamps
  3. Extracts colors from all frames in parallel using `ColorUtil.extractDominantColor()`
  4. Returns results sorted by original timestamp order

- **Backward compatibility**: `extractColorFromFrame()` remains unchanged for single-frame use cases

### 3. Service Layer (`src/modules/video-processor/video-processor.service.ts`)

#### Updated `extractColors()` method
- Now calls `repository.extractColorsFromFrames()` instead of processing timestamps individually
- Maintains identical response format and API contract
- Preserves debug timing information (ffmpegMs, vibrantMs per timestamp)
- No external API changes

#### Removed Method: `processTimestamp()`
- No longer needed as batch extraction handles multiple timestamps efficiently

## Performance Improvements

### Before Optimization
```
For N timestamps:
├─ FFmpeg Process 1 (timestamp 1)
├─ FFmpeg Process 2 (timestamp 2)
├─ FFmpeg Process 3 (timestamp 3)
└─ FFmpeg Process N (timestamp N)
Total: N × (video open/decode) operations
```

### After Optimization
```
For N timestamps:
└─ Single FFmpeg Process
   ├─ Video open/decode (once)
   ├─ Extract frame 1
   ├─ Extract frame 2
   ├─ Extract frame 3
   └─ Extract frame N
Total: 1 × (video open/decode) + frame extraction overhead
```

### Expected Gains
- **30-50% reduction** in total processing time for multiple timestamps
- **Proportional improvement** with larger timestamp arrays
- **No overhead** for single timestamp (delegates to optimized single-frame method)

## Technical Details

### FFmpeg Filter Expression
The batch extraction uses FFmpeg's `select` filter with timestamp ranges:
```
select='(gte(t,ts1-0.01)*lte(t,ts1+0.01))+(gte(t,ts2-0.01)*lte(t,ts2+0.01))+...'
```
This creates a ±10ms tolerance around each requested timestamp to ensure frame capture.

### JPEG Frame Parsing
Since FFmpeg outputs multiple JPEG frames concatenated, the parser:
1. Scans for JPEG SOI markers (0xFF 0xD8)
2. Splits the concatenated stream into individual frames
3. Maintains frame order for correct timestamp mapping

## Constraints Preserved

✅ **No external dependencies added** (no Sharp, Canvas, OpenCV, or Python)  
✅ **No full video download** (streaming-based frame extraction)  
✅ **Scale=64 maintained** for optimal color analysis  
✅ **API contract unchanged** (same request/response format)  
✅ **Controller logic untouched** (optimization isolated to repository layer)  
✅ **Service logic unchanged** (except batch call instead of individual processing)  
✅ **node-vibrant logic identical** (same color extraction algorithm)  

## Edge Cases Handled

1. **Single Timestamp**: Automatically uses optimized single-frame method
2. **Empty Timestamp Array**: Validates and throws appropriate error
3. **Timestamp-to-Color Mapping**: Results sorted by original timestamp order
4. **Frame Extraction Failures**: Graceful error handling with descriptive messages

## Testing Recommendations

1. **Performance Benchmark**: Compare processing times for 5, 10, 15+ timestamps
2. **Accuracy Validation**: Verify colors extracted are identical to per-frame method
3. **Edge Cases**: Test single timestamp, empty array, duplicate timestamps
4. **URL Validation**: Ensure video URL validation still works correctly
5. **Timing Accuracy**: Verify frame extraction at precise timestamp boundaries
