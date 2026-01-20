import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsUrl, Min } from 'class-validator';

export class ExtractColorsDto {
  @ApiProperty({
    description: 'URL of the video file or video page (e.g., Pexels video page)',
    example: 'https://www.pexels.com/video/... or https://example.com/video.mp4',
  })
  @IsString()
  @IsUrl({}, { message: 'videoUrl must be a valid URL' })
  videoUrl: string;

  @ApiProperty({
    description: 'Array of timestamps in milliseconds to extract frames from',
    example: [2000, 8000],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true, message: 'Each timestamp must be >= 0' })
  timestamps: number[];
}

export class ColorResultDto {
  @ApiProperty({
    description: 'Timestamp in milliseconds',
    example: 2000,
  })
  timestamp: number;

  @ApiProperty({
    description: 'Dominant color in HEX format',
    example: '#FF7850',
  })
  color: string;
}

export class ExtractColorsResponseDto {
  @ApiProperty({
    description: 'URL of the processed video',
    example: 'https://example.com/video.mp4',
  })
  videoUrl: string;

  @ApiProperty({
    description: 'Array of color results for each timestamp',
    type: [ColorResultDto],
  })
  results: ColorResultDto[];
}