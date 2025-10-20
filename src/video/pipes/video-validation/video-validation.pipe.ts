import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'path';

interface VideoValidationInput {
  videoFileName: string;
}

@Injectable()
export class VideoValidationPipe
  implements PipeTransform<VideoValidationInput>
{
  private readonly allowedExtensions = [
    '.mp4',
    '.avi',
    '.mov',
    '.mkv',
    '.webm',
  ];

  transform(value: VideoValidationInput): VideoValidationInput {
    const { videoFileName } = value;

    if (!videoFileName) {
      throw new BadRequestException('Video file is required');
    }

    const ext = path.extname(videoFileName).toLowerCase();

    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed: ${this.allowedExtensions.join(', ')}`,
      );
    }

    return value;
  }
}
