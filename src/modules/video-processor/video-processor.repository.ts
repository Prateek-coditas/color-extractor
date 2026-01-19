/**
 * Video Processor Repository
 * 
 * Custom repository pattern using plain TypeScript class.
 * This pattern allows for future PostgreSQL + TypeORM integration
 * while maintaining clean separation of concerns.
 * 
 * Currently implements in-memory operations.
 * Future: Can be extended to use TypeORM for database persistence.
 */
export class VideoProcessorRepository {
  /**
   * Store processing history (in-memory for now)
   * Future: Replace with TypeORM entity repository
   */
  private processingHistory: Map<
    string,
    { timestamp: Date; videoUrl: string; timestamps: number[] }
  > = new Map();

  /**
   * Save processing record
   * Future: Implement TypeORM save operation
   * @param videoUrl - URL of the processed video
   * @param timestamps - Array of timestamps processed
   */
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

    // Future: await this.videoProcessingEntityRepository.save({...})
  }

  /**
   * Get processing history for a video URL
   * Future: Implement TypeORM query operation
   * @param videoUrl - URL of the video
   * @returns Array of processing records
   */
  async getProcessingHistory(videoUrl: string): Promise<any[]> {
    const records = Array.from(this.processingHistory.values()).filter(
      (record) => record.videoUrl === videoUrl,
    );

    // Future: return await this.videoProcessingEntityRepository.find({ where: { videoUrl } })
    return records;
  }

  /**
   * Clear all processing history (useful for testing)
   * Future: Implement TypeORM delete operation
   */
  async clearHistory(): Promise<void> {
    this.processingHistory.clear();
    // Future: await this.videoProcessingEntityRepository.delete({})
  }
}
