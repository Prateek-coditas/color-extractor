# Request Flow - End-to-End Lifecycle

## Complete Request Lifecycle

This document explains the complete flow from HTTP request to response, showing how each layer interacts.

---

## Architecture Flow

```
HTTP Request
    ↓
Controller (HTTP handling)
    ↓
Service (Orchestration & business logic)
    ↓
Repository (External operations & data access)
    ↓
Utils (Pure helper functions)
    ↓
Response
```

---

## Step-by-Step: Single Timestamp Processing

### Example Request

```json
POST /api/video/extract-colors
{
  "videoUrl": "https://example.com/video.mp4",
  "timestamps": [3000]
}
```

### Detailed Flow

#### **Step 1: Controller Receives Request**

**File:** `video-processor.controller.ts`

```typescript
@Post('extract-colors')
async extractColors(@Body() dto: ExtractColorsDto) {
  return this.videoProcessorService.extractColors(dto);
}
```

**What happens:**
- NestJS receives HTTP POST request
- ValidationPipe validates `ExtractColorsDto`:
  - `videoUrl` must be valid URL
  - `timestamps` must be array of numbers >= 0
- Controller delegates to Service
- **No business logic here** - pure HTTP handling

---

#### **Step 2: Service Orchestrates**

**File:** `video-processor.service.ts`

```typescript
async extractColors(dto: ExtractColorsDto) {
  // 1. Get video duration via Repository
  const videoDuration = await this.repository.getVideoDuration(dto.videoUrl);
  
  // 2. Validate timestamps
  if (invalidTimestamps.length > 0) {
    throw new BadRequestException(...);
  }
  
  // 3. Process timestamp
  const colorResult = await this.processTimestamp(dto.videoUrl, 3000);
  
  // 4. Save record via Repository
  await this.repository.saveProcessingRecord(...);
  
  // 5. Return results
  return { videoUrl, results: [colorResult] };
}
```

**What happens:**
- **Orchestration:** Coordinates the workflow
- **Validation:** Checks timestamps are valid
- **Delegation:** Calls Repository for external operations
- **Error handling:** Wraps errors in appropriate HTTP responses

**Responsibilities:**
- ✅ Business logic (validation, orchestration)
- ✅ Error handling
- ❌ Direct FFmpeg/color operations (delegated to Repository)

---

#### **Step 3: Repository Handles External Operations**

**File:** `video-processor.repository.ts`

```typescript
async extractColorFromFrame(videoUrl: string, timestampMs: number) {
  // Delegate to Utils
  const frameBuffer = await FfmpegUtil.extractFrame(videoUrl, timestampMs);
  const dominantColor = await ColorUtil.extractDominantColor(frameBuffer);
  return dominantColor;
}
```

**What happens:**
- **External operations:** Handles FFmpeg and color extraction
- **Delegates to Utils:** Calls pure helper functions
- **Abstraction:** Service doesn't know about FFmpeg/color details

**Responsibilities:**
- ✅ External service calls (FFmpeg)
- ✅ Data operations (color extraction)
- ✅ Abstraction layer between Service and Utils
- ❌ Business logic (handled by Service)

---

#### **Step 4: Utils Execute Pure Operations**

**File:** `utils/ffmpeg.util.ts`

```typescript
static async extractFrame(videoUrl: string, timestampMs: number) {
  // FFmpeg operations
  ffmpeg(videoUrl)
    .seekInput(timestampSeconds)
    .frames(1)
    .outputOptions(['-vf', 'scale=200:-1'])
    .output(outputPath)
    .run();
  // Returns Buffer
}
```

**File:** `utils/color.util.ts`

```typescript
static async extractDominantColor(imageBuffer: Buffer) {
  const palette = await Vibrant.from(imageBuffer).getPalette();
  const vibrantSwatch = palette.Vibrant || palette.Muted || ...;
  return rgbToHex(vibrantSwatch.rgb);
}
```

**What happens:**
- **Pure functions:** No side effects (except FFmpeg file I/O)
- **Single responsibility:** One function, one purpose
- **Reusable:** Can be called from anywhere

**Responsibilities:**
- ✅ Specific technical operations
- ✅ No business logic
- ✅ No orchestration

---

## Step-by-Step: Multiple Timestamps Processing

### Example Request

```json
{
  "videoUrl": "https://example.com/video.mp4",
  "timestamps": [3000, 8000, 15000]
}
```

### Flow

#### **Step 1-2: Same as above**
- Controller receives request
- Service validates video duration

#### **Step 3: Parallel Processing**

**Service:**
```typescript
const colorPromises = dto.timestamps.map((timestamp) =>
  this.processTimestamp(dto.videoUrl, timestamp)
);

const colorResults = await Promise.all(colorPromises);
```

**What happens:**
- Creates 3 promises (one per timestamp)
- Processes all timestamps **in parallel**
- Waits for all to complete
- Returns array of results

**Parallel execution:**
```
Timestamp 3000ms  ──┐
Timestamp 8000ms  ──┼──→ Promise.all() → [result1, result2, result3]
Timestamp 15000ms ──┘
```

**Why parallel:**
- Each timestamp is independent
- FFmpeg operations can run simultaneously
- Faster than sequential processing

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ HTTP POST /api/video/extract-colors                         │
│ Body: { videoUrl, timestamps: [3000, 8000] }                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Controller (video-processor.controller.ts)                  │
│ - Receives HTTP request                                     │
│ - Validates DTO (ValidationPipe)                            │
│ - Delegates to Service                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Service (video-processor.service.ts)                        │
│ 1. Calls Repository.getVideoDuration()                      │
│ 2. Validates timestamps < duration                         │
│ 3. For each timestamp:                                       │
│    - Calls processTimestamp()                               │
│ 4. Calls Repository.saveProcessingRecord()                  │
│ 5. Returns response                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (for each timestamp)
┌─────────────────────────────────────────────────────────────┐
│ Repository (video-processor.repository.ts)                   │
│ - Calls FfmpegUtil.extractFrame()                            │
│ - Calls ColorUtil.extractDominantColor()                    │
│ - Returns HEX color                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                              │
        ▼                              ▼
┌──────────────────┐         ┌──────────────────┐
│ FfmpegUtil       │         │ ColorUtil         │
│ - Seek to time   │         │ - Analyze image   │
│ - Extract frame  │         │ - Get palette      │
│ - Resize (200px) │         │ - Select swatch    │
│ - Return Buffer  │         │ - Convert to HEX  │
└──────────────────┘         └──────────────────┘
        │                              │
        └──────────────┬──────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Response                                                     │
│ {                                                            │
│   "videoUrl": "...",                                         │
│   "results": [                                                │
│     { "timestamp": 3000, "color": "#FF7850" },               │
│     { "timestamp": 8000, "color": "#6496C8" }                │
│   ]                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities Summary

### Controller
- **Receives:** HTTP requests
- **Validates:** Request format (via DTOs)
- **Delegates:** To Service
- **Returns:** HTTP responses
- **Does NOT:** Business logic, external operations

### Service
- **Orchestrates:** Complete workflow
- **Validates:** Business rules (timestamps, duration)
- **Coordinates:** Repository calls
- **Handles:** Errors and exceptions
- **Does NOT:** Direct FFmpeg/color operations

### Repository
- **Handles:** External operations (FFmpeg, color extraction)
- **Abstracts:** Technical details from Service
- **Stores:** Processing history
- **Delegates:** To Utils for pure operations
- **Does NOT:** Business logic, HTTP handling

### Utils
- **Executes:** Pure technical operations
- **FFmpegUtil:** Frame extraction and resizing
- **ColorUtil:** Color analysis and conversion
- **Does NOT:** Business logic, orchestration, HTTP

---

## Data Flow

### Request → Response Data Transformation

```
Input:
{
  "videoUrl": "https://example.com/video.mp4",
  "timestamps": [3000, 8000]
}

↓ Controller (passes through)

↓ Service (validates, orchestrates)

↓ Repository (for each timestamp)
  - Input: videoUrl + timestamp
  - FFmpeg: videoUrl + timestamp → JPEG Buffer
  - ColorUtil: JPEG Buffer → HEX color
  - Output: HEX color

↓ Service (assembles results)

↓ Controller (formats response)

Output:
{
  "videoUrl": "https://example.com/video.mp4",
  "results": [
    { "timestamp": 3000, "color": "#FF7850" },
    { "timestamp": 8000, "color": "#6496C8" }
  ]
}
```

---

## Error Flow

### Error Handling Path

```
Error occurs in Utils
    ↓
Caught in Repository
    ↓
Wrapped and re-thrown
    ↓
Caught in Service
    ↓
Converted to BadRequestException
    ↓
Returned by Controller as 400 Bad Request
```

**Example:**
- FFmpeg fails → Utils throws error
- Repository catches → Wraps with context
- Service catches → Converts to BadRequestException
- Controller returns → 400 status with error message

---

## Key Design Principles

### Separation of Concerns
- Each layer has a single, clear responsibility
- No mixing of HTTP, business logic, and technical operations

### Dependency Direction
- Controller depends on Service
- Service depends on Repository
- Repository depends on Utils
- Utils depend on nothing (pure functions)

### Testability
- Each layer can be tested independently
- Mock dependencies easily (Service mocks Repository, etc.)

---

## Summary

**Flow:** Controller → Service → Repository → Utils

**Single timestamp:** Sequential flow through all layers

**Multiple timestamps:** Parallel processing at Service level, then sequential through Repository/Utils

**Result:** Clean, maintainable, testable architecture with clear responsibilities.
