import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import axios from 'axios';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export class FfmpegUtil {
  private static readonly TEMP_DIR = path.join(process.cwd(), 'temp-frames');

  /**
   * Ensures the temporary frames directory exists
   */
  private static async ensureTempDir(): Promise<void> {
    try {
      await access(this.TEMP_DIR);
    } catch {
      await mkdir(this.TEMP_DIR, { recursive: true });
    }
  }

  /**
   * Extracts a single frame from a video at a specific timestamp
   * Resizes the frame using FFmpeg scale filter (200px width, maintain aspect ratio)
   * Optimized for node-vibrant color extraction
   * @param videoUrl - URL of the video file or video page (e.g., Pexels)
   * @param timestampMs - Timestamp in milliseconds
   * @returns Buffer containing the resized frame image data (JPEG format)
   */
  static async extractFrame(
    videoUrl: string,
    timestampMs: number,
  ): Promise<Buffer> {
    // Validate URL format
    if (!this.isValidVideoUrl(videoUrl)) {
      throw new Error(
        'Invalid video URL. Please provide either a direct link to a video file ' +
        '(e.g., .mp4, .avi, .mov) or a Pexels video page URL (e.g., https://www.pexels.com/video/...)'
      );
    }

    // Resolve page URLs to direct video URLs
    const resolvedUrl = await this.resolveVideoUrl(videoUrl);
    
    await this.ensureTempDir();

    const timestampSeconds = timestampMs / 1000;
    const outputPath = path.join(
      this.TEMP_DIR,
      `frame_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`,
    );

    return new Promise((resolve, reject) => {
      ffmpeg(resolvedUrl)
        .seekInput(timestampSeconds)
        .frames(1)
        .outputOptions([
          '-vf',
          'scale=200:-1', // Resize to 200px width, maintain aspect ratio (-1 = auto height)
          '-q:v',
          '2', // High quality JPEG
        ])
        .output(outputPath)
        .on('end', async () => {
          try {
            const frameBuffer = fs.readFileSync(outputPath);
            await unlink(outputPath);
            resolve(frameBuffer);
          } catch (error) {
            reject(
              new Error(
                `Failed to read extracted frame: ${error.message}`,
              ),
            );
          }
        })
        .on('error', (error) => {
          // Clean up on error
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
          reject(
            new Error(
              `FFmpeg extraction failed: ${error.message}. Make sure FFmpeg is installed and the video URL is accessible.`,
            ),
          );
        })
        .run();
    });
  }

  /**
   * Resolves webpage URLs to direct video file URLs
   * Currently supports Pexels video pages
   * @param videoUrl - URL to resolve
   * @returns Direct video URL if resolvable, otherwise returns original URL
   */
  private static async resolveVideoUrl(videoUrl: string): Promise<string> {
    const lowerUrl = videoUrl.toLowerCase();
    
    // Check if it's a Pexels video page
    if (lowerUrl.includes('pexels.com') && lowerUrl.includes('/video/')) {
      try {
        const response = await axios.get(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const html = response.data;
        
        // Extract the HD or regular video URL from Pexels page
        // Pexels typically has URLs like: src="https://cdn.pexels.com/videos/..."
        const videoUrlMatch = html.match(/src="(https:\/\/cdn\.pexels\.com\/videos\/[^"]+\.mp4)"/);
        if (videoUrlMatch && videoUrlMatch[1]) {
          return videoUrlMatch[1];
        }
      } catch (error) {
        console.warn(`Failed to resolve Pexels URL: ${error.message}`);
      }
    }
    
    return videoUrl;
  }

  /**
   * Validates if URL is a direct video file or resolvable video page
   * Supports: direct video files, S3 URLs, CDN URLs, and known video pages
   * @param videoUrl - URL to validate
   * @returns true if URL is valid
   */
  private static isValidVideoUrl(videoUrl: string): boolean {
    try {
      new URL(videoUrl);
    } catch {
      return false;
    }
    
    const lowerUrl = videoUrl.toLowerCase();
    
    // Allow direct video file URLs (with or without query parameters)
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];
    const hasVideoExtension = videoExtensions.some(ext => lowerUrl.includes(ext));
    if (hasVideoExtension) {
      return true;
    }
    
    // Allow S3 URLs and other known CDN/storage URLs
    const trustedDomains = ['s3.', 'amazonaws.com', 'cloudfront.net', 'cdn.', 'storage.googleapis.com'];
    const isTrustedDomain = trustedDomains.some(domain => lowerUrl.includes(domain));
    if (isTrustedDomain) {
      return true;
    }
    
    // Allow known video page URLs that we can resolve
    const supportedPages = ['pexels.com'];
    const isSupportedPage = supportedPages.some(domain => lowerUrl.includes(domain));
    if (isSupportedPage && lowerUrl.includes('/video/')) {
      return true;
    }
    
    return false;
  }

  /**
   * Gets video duration in milliseconds
   * @param videoUrl - URL of the video file or video page (e.g., Pexels)
   * @returns Duration in milliseconds
   */
  static async getVideoDuration(videoUrl: string): Promise<number> {
    // Validate URL format
    if (!this.isValidVideoUrl(videoUrl)) {
      throw new Error(
        'Invalid video URL. Please provide either a direct link to a video file ' +
        '(e.g., .mp4, .avi, .mov), an S3/CDN URL, or a Pexels video page URL (e.g., https://www.pexels.com/video/...)'
      );
    }

    // Resolve page URLs to direct video URLs
    const resolvedUrl = await this.resolveVideoUrl(videoUrl);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(resolvedUrl, (err, metadata) => {
        if (err) {
          // Provide more helpful error message based on error type
          let errorMessage = `Failed to process video: ${err.message}`;
          const errMsg = err.message.toLowerCase();
          
          console.error(`FFprobe error for URL ${resolvedUrl}:`, err);
          
          // Check for specific error types
          if (errMsg.includes('404') || errMsg.includes('not found')) {
            errorMessage = 
              'Video file not found (404). The video file does not exist at the provided URL. ' +
              'Please verify the URL is correct and the file exists.';
          } else if (errMsg.includes('403') || errMsg.includes('forbidden') || errMsg.includes('unauthorized')) {
            errorMessage = 
              'Access denied to video URL (403/401). The file exists but requires authentication or is not publicly accessible. ' +
              'Please ensure you have the proper access rights or use a publicly accessible URL.';
          } else if (errMsg.includes('connection') || errMsg.includes('timeout') || errMsg.includes('econnrefused')) {
            errorMessage = 
              'Cannot connect to video URL. The server is unreachable or the connection timed out. ' +
              'Please verify the URL is accessible and check your network connection.';
          } else if (errMsg.includes('invalid') && (errMsg.includes('format') || errMsg.includes('stream'))) {
            errorMessage = 
              'Invalid video format or corrupted file. The URL points to a file that is not a valid video. ' +
              'Please ensure the URL is a direct link to a valid video file (e.g., .mp4, .avi, .mov).';
          } else if (errMsg.includes('no such file') || errMsg.includes('does not exist')) {
            errorMessage = 
              'Video URL is not accessible or does not exist. ' +
              'Please verify the URL is correct, publicly accessible, and points to a valid video file.';
          } else if (errMsg.includes('moov atom not found') || errMsg.includes('invalid data found')) {
            errorMessage = 
              'Invalid MP4 file or corrupted video. The video file is missing critical metadata (MOOV atom). ' +
              'This usually means: (1) the file is corrupted, (2) the file was not fully uploaded, or (3) the file structure is incompatible with streaming. ' +
              'Try downloading and re-encoding the video locally, or ensure the file is fully uploaded and valid.';
          } else if (errMsg.includes('protocol') || errMsg.includes('unknown')) {
            errorMessage = 
              'Unable to access video URL. This could be due to network issues, redirects, or CORS restrictions. ' +
              'Please ensure the URL is a direct link to a publicly accessible video file.';
          }
          
          reject(new Error(errorMessage));
          return;
        }

        const durationSeconds = metadata.format.duration;
        if (!durationSeconds) {
          reject(new Error('Could not determine video duration from the file'));
          return;
        }

        resolve(Math.floor(durationSeconds * 1000));
      });
    });
  }

  /**
   * Validates that FFmpeg is installed and accessible
   * @returns true if FFmpeg is available
   */
  static async isFfmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.getAvailableEncoders((err) => {
        resolve(!err);
      });
    });
  }
}