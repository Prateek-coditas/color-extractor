import { Injectable, BadRequestException } from '@nestjs/common';
import { FfmpegUtil } from './utils/ffmpeg.util';
import { ColorUtil } from './utils/color.util';
import { VideoProcessorRepository } from './video-processor.repository';
import {
  ExtractColorsDto,
  ExtractColorsResponseDto,
  ColorResultDto,
} from './dto/extract-colors.dto';

@Injectable()
export class VideoProcessorService {
  constructor(
    private readonly repository: VideoProcessorRepository,
  ) {}

  /**
   * Extracts dominant colors from video frames at specified timestamps
   * @param dto - ExtractColorsDto containing videoUrl and timestamps
   * @returns ExtractColorsResponseDto with color results
   */
  async extractColors(
    dto: ExtractColorsDto,
  ): Promise<ExtractColorsResponseDto> {
    const startTime = Date.now();

    try {
      // Validate video URL accessibility and get duration
      const videoDuration = await FfmpegUtil.getVideoDuration(dto.videoUrl);

      // Validate timestamps are within video duration
      const invalidTimestamps = dto.timestamps.filter(
        (ts) => ts > videoDuration,
      );

      if (invalidTimestamps.length > 0) {
        throw new BadRequestException(
          `Timestamps ${invalidTimestamps.join(', ')} exceed video duration of ${videoDuration}ms`,
        );
      }

      // Process each timestamp in parallel for better performance
      const colorPromises = dto.timestamps.map((timestamp) =>
        this.processTimestamp(dto.videoUrl, timestamp),
      );

      const colorResults = await Promise.all(colorPromises);

      // Save processing record
      await this.repository.saveProcessingRecord(
        dto.videoUrl,
        dto.timestamps,
      );

      return {
        videoUrl: dto.videoUrl,
        results: colorResults,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to extract colors: ${error.message}`,
      );
    }
  }

  /**
   * Processes a single timestamp: extracts and scales frame, then determines dominant color
   * @param videoUrl - URL of the video
   * @param timestamp - Timestamp in milliseconds
   * @returns ColorResultDto with timestamp and color
   */
  private async processTimestamp(
    videoUrl: string,
    timestamp: number,
  ): Promise<ColorResultDto> {
    try {
      // Extract frame at timestamp using FFmpeg (includes scaling via scale filter)
      const frameBuffer = await FfmpegUtil.extractFrame(videoUrl, timestamp);

      // Extract dominant color from the frame
      const dominantColor = await ColorUtil.extractDominantColor(
        frameBuffer,
      );

      return {
        timestamp,
        color: dominantColor,
      };
    } catch (error) {
      throw new Error(
        `Failed to process timestamp ${timestamp}ms: ${error.message}`,
      );
    }
  }

  /**
   * Validates that FFmpeg is available
   * @returns true if FFmpeg is installed and accessible
   */
  async validateFfmpeg(): Promise<boolean> {
    return FfmpegUtil.isFfmpegAvailable();
  }
}
