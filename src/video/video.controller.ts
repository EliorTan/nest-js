import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Get,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { SegmentVideoDto } from './dto/segment-video.dto';
import { AuthGuard } from './guards/auth/auth.guard';
import { LoggingInterceptor } from './interceptors/logging/logging.interceptor';
import { VideoValidationPipe } from './pipes/video-validation/video-validation.pipe';

@Controller('video')
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('segment')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async segmentVideo(
    @Body(VideoValidationPipe) segmentVideoDto: SegmentVideoDto,
  ) {
    return this.videoService.segmentVideo(segmentVideoDto);
  }

  @Get('list')
  async listVideos() {
    const videos = await this.videoService.listVideos();
    return {
      count: videos.length,
      videos,
    };
  }
}
