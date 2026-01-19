import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

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
   * @param videoUrl - URL of the video file
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
        'Invalid video URL. Please provide a direct link to a video file (e.g., .mp4, .avi, .mov). ' +
        'Webpage URLs are not supported.'
      );
    }
    await this.ensureTempDir();

    const timestampSeconds = timestampMs / 1000;
    const outputPath = path.join(
      this.TEMP_DIR,
      `frame_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`,
    );

    return new Promise((resolve, reject) => {
      ffmpeg(videoUrl)
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
   * Validates if URL appears to be a direct video file URL
   * @param videoUrl - URL to validate
   * @returns true if URL looks like a direct video file
   */
  private static isValidVideoUrl(videoUrl: string): boolean {
    const lowerUrl = videoUrl.toLowerCase();
    
    // Check if it's a known video hosting page (not direct file)
    // These patterns indicate HTML pages, not direct video files
    const isVideoPage = lowerUrl.includes('/video/') && 
                       (lowerUrl.includes('pexels.com') || 
                        lowerUrl.includes('pixabay.com') || 
                        lowerUrl.includes('youtube.com') ||
                        lowerUrl.includes('vimeo.com'));
    
    // Reject known video page URLs
    if (isVideoPage) {
      return false;
    }
    
    // Check if URL contains video file extension
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];
    const hasVideoExtension = videoExtensions.some(ext => lowerUrl.includes(ext));
    
    // Allow URLs with video extensions
    // Note: Some CDN URLs might not have extensions, but we'll let FFmpeg handle those
    return hasVideoExtension;
  }

  /**
   * Gets video duration in milliseconds
   * @param videoUrl - URL of the video file
   * @returns Duration in milliseconds
   */
  static async getVideoDuration(videoUrl: string): Promise<number> {
    // Validate URL format
    if (!this.isValidVideoUrl(videoUrl)) {
      throw new Error(
        'Invalid video URL. Please provide a direct link to a video file (e.g., .mp4, .avi, .mov). ' +
        'Webpage URLs (like Pexels video pages) are not supported. ' +
        'You need to use the direct video file URL instead.'
      );
    }

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoUrl, (err, metadata) => {
        if (err) {
          // Provide more helpful error message
          let errorMessage = `Failed to probe video: ${err.message}`;
          
          if (err.message.includes('Invalid data') || err.message.includes('Invalid')) {
            errorMessage = 
              'Invalid video URL. The URL provided does not point to a valid video file. ' +
              'Please ensure you are using a direct link to a video file (e.g., .mp4, .avi, .mov), ' +
              'not a webpage URL. Example: https://example.com/video.mp4';
          } else if (err.message.includes('HTTP error') || err.message.includes('404')) {
            errorMessage = 
              'Video URL not accessible. The video file could not be found or accessed. ' +
              'Please check that the URL is correct and publicly accessible.';
          }
          
          reject(new Error(errorMessage));
          return;
        }

        const durationSeconds = metadata.format.duration;
        if (!durationSeconds) {
          reject(new Error('Could not determine video duration'));
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
