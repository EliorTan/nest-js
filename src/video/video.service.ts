import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SegmentVideoDto } from './dto/segment-video.dto';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly inputFolder = path.join(process.cwd(), 'videos');
  private readonly outputFolder = path.join(process.cwd(), 'segments');

  async segmentVideo(
    segmentVideoDto: SegmentVideoDto,
  ): Promise<{ message: string; segmentsCreated: number; outputPath: string }> {
    const { videoFileName, segmentDuration = 10 } = segmentVideoDto;
    const inputPath = path.join(this.inputFolder, videoFileName);

    // Ensure folders exist
    await this.ensureFoldersExist();

    // Check if video file exists
    await this.checkFileExists(inputPath);

    // Create unique output folder for this segmentation
    const timestamp = Date.now();
    const videoBaseName = path.parse(videoFileName).name;
    const segmentOutputFolder = path.join(
      this.outputFolder,
      `${videoBaseName}_${timestamp}`,
    );

    await fs.mkdir(segmentOutputFolder, { recursive: true });

    // Perform segmentation
    const segmentsCreated = await this.performSegmentation(
      inputPath,
      segmentOutputFolder,
      videoBaseName,
      segmentDuration,
    );

    return {
      message: 'Video segmentation completed successfully',
      segmentsCreated,
      outputPath: segmentOutputFolder,
    };
  }

  private async ensureFoldersExist(): Promise<void> {
    try {
      await fs.mkdir(this.inputFolder, { recursive: true });
      await fs.mkdir(this.outputFolder, { recursive: true });
      this.logger.log('Folders ensured to exist');
    } catch (error) {
      this.logger.error('Error creating folders', error);
      throw new InternalServerErrorException(
        'Failed to create necessary folders',
      );
    }
  }

  private async checkFileExists(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch (error) {
      this.logger.error(`File not found: ${filePath}, Error: ${error}`);
      throw new NotFoundException(
        `Video file not found: ${path.basename(filePath)}`,
      );
    }
  }

  private performSegmentation(
    inputPath: string,
    outputFolder: string,
    baseName: string,
    segmentDuration: number,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const outputPattern = path.join(
        outputFolder,
        `${baseName}_segment_%03d.mp4`,
      );
      let segmentCount = 0;

      this.logger.log(`Starting segmentation: ${inputPath}`);
      this.logger.log(`Segment duration: ${segmentDuration} seconds`);

      ffmpeg(inputPath)
        .outputOptions([
          `-c copy`, // Copy codec (fast, no re-encoding)
          `-map 0`, // Map all streams
          `-f segment`, // Segment format
          `-segment_time ${segmentDuration}`, // Duration of each segment
          `-reset_timestamps 1`, // Reset timestamps for each segment
        ])
        .output(outputPattern)
        .on('start', (commandLine) => {
          this.logger.log(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          this.logger.log(`Processing: ${progress.percent?.toFixed(2)}% done`);
        })
        .on('end', () => {
          fs.readdir(outputFolder)
            .then((files) => {
              segmentCount = files.length;
              this.logger.log(
                `Segmentation completed. Created ${segmentCount} segments`,
              );
              resolve(segmentCount);
            })
            .catch((error) => {
              this.logger.error('Error reading output folder', error);
              reject(
                new InternalServerErrorException('Failed to count segments'),
              );
            });
        })
        .on('error', (error) => {
          this.logger.error('FFmpeg error', error);
          reject(
            new InternalServerErrorException(`FFmpeg error: ${error.message}`),
          );
        })
        .run();
    });
  }

  async listVideos(): Promise<string[]> {
    try {
      await this.ensureFoldersExist();
      const files = await fs.readdir(this.inputFolder);
      return files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext);
      });
    } catch (error) {
      this.logger.error('Error listing videos', error);
      throw new InternalServerErrorException('Failed to list videos');
    }
  }
}
