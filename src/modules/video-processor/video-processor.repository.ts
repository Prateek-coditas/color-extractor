import { FfmpegUtil } from './utils/ffmpeg.util';
import { ColorUtil } from './utils/color.util';

export class VideoProcessorRepository {
  private processingHistory: Map<
    string,
    { timestamp: Date; videoUrl: string; timestamps: number[] }
  > = new Map();

  async getVideoDuration(videoUrl: string): Promise<number> {
    return FfmpegUtil.getVideoDuration(videoUrl);
  }

  async extractColorFromFrame(
    videoUrl: string,
    timestampMs: number,
  ): Promise<string> {
    const frameBuffer = await FfmpegUtil.extractFrame(videoUrl, timestampMs);

    const dominantColor = await ColorUtil.extractDominantColor(frameBuffer);

    return dominantColor;
  }

  async isFfmpegAvailable(): Promise<boolean> {
    return FfmpegUtil.isFfmpegAvailable();
  }

  async saveProcessingRecord(
    videoUrl: string,
    timestamps: number[],
  ): Promise<void> {
    const recordId = `${videoUrl}_${Date.now()}`;
    this.processingHistory.set(recordId, {
      timestamp: new Date(),
      videoUrl,
      timestamps,
    });
  }

  async getProcessingHistory(videoUrl: string): Promise<any[]> {
    return Array.from(this.processingHistory.values()).filter(
      (record) => record.videoUrl === videoUrl,
    );
  }

  async clearHistory(): Promise<void> {
    this.processingHistory.clear();
  }
}