# Video Color Extractor - NestJS Backend API

A production-grade NestJS backend API that extracts dominant colors from video frames at specified timestamps using FFmpeg and returns results in HEX format.

## 🎯 Project Overview

This backend service accepts a video URL and an array of timestamps (in milliseconds), extracts frames at those timestamps using FFmpeg, determines the dominant color from each frame, and returns the results as JSON.

## 🏗️ Architecture

- **Framework**: NestJS (TypeScript)
- **Video Processing**: FFmpeg (CLI) - handles frame extraction and resizing
- **Color Extraction**: node-vibrant (Material Design algorithm)
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Repository Pattern**: Custom TypeScript classes (ready for TypeORM integration)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **FFmpeg** (must be installed and accessible in your system PATH)

### Installing FFmpeg

#### Windows
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
# Add FFmpeg to your system PATH
```

#### macOS
```bash
# Using Homebrew
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

### Verify FFmpeg Installation

```bash
ffmpeg -version
```

You should see FFmpeg version information. If not, ensure FFmpeg is in your system PATH.

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- NestJS core packages
- FFmpeg wrapper (fluent-ffmpeg)
- Color extraction (node-vibrant)
- Validation and Swagger packages

### Step 2: Build the Project

```bash
npm run build
```

### Step 3: Start the Development Server

```bash
npm run start:dev
```

The application will start on `http://localhost:3000`

### Step 4: Verify FFmpeg Availability

Before testing the API, verify that FFmpeg is accessible:

```bash
# Using the health check endpoint
curl http://localhost:3000/api/video/health
```

Or visit: `http://localhost:3000/api/video/health`

Expected response:
```json
{
  "ffmpegAvailable": true,
  "message": "FFmpeg is installed and accessible"
}
```

## 📚 API Documentation

Once the server is running, access Swagger documentation at:

**http://localhost:3000/api/docs**

The Swagger UI provides interactive API documentation where you can test endpoints directly.

## 🔌 API Endpoints

### POST /api/video/extract-colors

Extracts dominant colors from video frames at specified timestamps.

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "timestamps": [2000, 8000]
}
```

**Response:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "results": [
    { "timestamp": 2000, "color": "#FF7850" },
    { "timestamp": 8000, "color": "#6496C8" }
  ]
}
```

### GET /api/video/health

Checks FFmpeg availability.

**Response:**
```json
{
  "ffmpegAvailable": true,
  "message": "FFmpeg is installed and accessible"
}
```

## 🧪 Testing with Postman

### 1. Setup Postman Collection

1. Open Postman
2. Create a new request
3. Set method to **POST**
4. Set URL to: `http://localhost:3000/api/video/extract-colors`
5. Go to **Headers** tab and add:
   - Key: `Content-Type`
   - Value: `application/json`

### 2. Test Request Body

Go to **Body** tab, select **raw** and **JSON**, then paste:

```json
{
  "videoUrl": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
  "timestamps": [1000, 5000, 10000]
}
```

### 3. Send Request

Click **Send** and you should receive a response with color data.

### 4. Test Error Cases

**Invalid URL:**
```json
{
  "videoUrl": "https://invalid-url.com/video.mp4",
  "timestamps": [1000]
}
```

**Timestamp beyond video duration:**
```json
{
  "videoUrl": "https://example.com/short-video.mp4",
  "timestamps": [999999999]
}
```

## 📁 Project Structure

```
src/
├── main.ts                          # Application entry point with Swagger & validation setup
├── app.module.ts                     # Root module
├── modules/
│   └── video-processor/
│       ├── video-processor.module.ts
│       ├── video-processor.controller.ts
│       ├── video-processor.service.ts
│       ├── video-processor.repository.ts  # Custom repository (ready for TypeORM)
│       ├── dto/
│       │   └── extract-colors.dto.ts      # Request/Response DTOs
│       └── utils/
│           ├── ffmpeg.util.ts             # FFmpeg frame extraction & resizing
│           └── color.util.ts              # Color extraction utilities
```

## 🔧 Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot-reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

## 🎨 How It Works

1. **Request Validation**: DTOs validate the incoming request (URL format, timestamps array)
2. **Video Duration Check**: FFmpeg probes the video to get duration and validate timestamps
3. **Frame Extraction**: For each timestamp, FFmpeg extracts a frame and resizes it to 200px width (maintains aspect ratio)
4. **Color Extraction**: Dominant color is extracted using node-vibrant (Material Design algorithm)
5. **Response**: Results are returned in HEX format

**Pipeline:** FFmpeg (extract + scale) → Image Buffer → node-vibrant → HEX Color

## ⚡ Performance Optimizations

- **4K Video Support**: Frames are automatically resized to 200px width during FFmpeg extraction
- **Streaming**: FFmpeg seeks directly to timestamps (doesn't download full video)
- **Parallel Processing**: Multiple timestamps are processed in parallel using `Promise.all()`
- **Memory Efficient**: Frames are processed as buffers, not stored on disk
- **Temporary File Cleanup**: Extracted frames are automatically deleted after processing

## 🛡️ Error Handling

The API handles various error scenarios:

- **Invalid URL**: Returns 400 Bad Request
- **FFmpeg Not Available**: Returns 400 with clear error message
- **Timestamp Beyond Duration**: Returns 400 with specific invalid timestamps
- **Video Access Error**: Returns 400 with FFmpeg error details

## 🔮 Future Enhancements

The repository pattern is designed to easily integrate:

- **PostgreSQL + TypeORM**: Replace in-memory storage with database
- **Caching**: Add Redis for frequently requested videos
- **Queue System**: Use Bull/BullMQ for processing long videos
- **Multiple Color Formats**: Extend to support RGB, HSL, etc.
- **Batch Processing**: Process multiple videos in a single request

## 📝 Notes

- The service does NOT download the full video into memory (streams via FFmpeg)
- The service does NOT use headless browsers (Puppeteer/Playwright)
- All processing happens server-side using FFmpeg and node-vibrant
- Color format is strictly HEX (e.g., "#FF7850")
- Timestamps are fully dynamic and can be any number >= 0
- **AWS S3 Compatible**: Works with public S3 URLs or pre-signed URLs

## 📚 Documentation

- **Quick Start**: See `QUICK_START.md`
- **Logic Explanation**: See `LOGIC_EXPLANATION.md` (complete technical details)
- **Video URL Guide**: See `VIDEO_URL_GUIDE.md` (how to get direct video URLs)
- **FFmpeg Installation**: See `FFMPEG_INSTALL_WINDOWS.md` (Windows-specific)

## 🐛 Troubleshooting

### FFmpeg Not Found

If you get "FFmpeg not found" errors:

1. Verify FFmpeg is installed: `ffmpeg -version`
2. Ensure FFmpeg is in your system PATH
3. Restart your terminal/IDE after installing FFmpeg
4. Check the health endpoint: `GET /api/video/health`

### Video URL Not Accessible

- Ensure the video URL is publicly accessible
- Check your network connection
- Verify the video format is supported by FFmpeg (MP4, AVI, MOV, etc.)

### Port Already in Use

If port 3000 is already in use:

1. Change the port in `src/main.ts`:
   ```typescript
   const port = process.env.PORT || 3001; // Change to 3001 or any available port
   ```

2. Or set environment variable:
   ```bash
   PORT=3001 npm run start:dev
   ```

## 📄 License

MIT
