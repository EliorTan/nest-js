import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { VideoService } from './video.service';
import * as fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock fluent-ffmpeg
jest.mock('fluent-ffmpeg');
const mockFfmpeg = ffmpeg as jest.MockedFunction<typeof ffmpeg>;

describe('VideoService', () => {
  let service: VideoService;
  let mockFfmpegInstance: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup fluent-ffmpeg mock
    mockFfmpegInstance = {
      inputOptions: jest.fn().mockReturnThis(),
      outputOptions: jest.fn().mockReturnThis(),
      output: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      run: jest.fn(),
    };

    mockFfmpeg.mockReturnValue(mockFfmpegInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoService],
    }).compile();

    service = module.get<VideoService>(VideoService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('segmentVideo', () => {
    const mockDto = {
      videoFileName: 'test.mp4',
      segmentDuration: 10,
    };

    beforeEach(() => {
      // Mock fs.mkdir to resolve successfully
      mockFs.mkdir.mockResolvedValue(undefined);
    });

    it('should successfully segment a video', async () => {
      // Mock successful segmentation
      mockFs.readdir.mockResolvedValue(['segment1.mp4', 'segment2.mp4'] as any);

      // Setup FFmpeg event handlers to simulate success
      mockFfmpegInstance.on.mockImplementation(
        (event: string, callback: Function) => {
          if (event === 'start') {
            callback('ffmpeg command line');
          } else if (event === 'progress') {
            callback({ percent: 50 });
          } else if (event === 'end') {
            // Simulate async operation in the end handler
            setTimeout(() => callback(), 0);
          }
          return mockFfmpegInstance;
        },
      );

      mockFfmpegInstance.run.mockImplementation(() => {
        // Trigger the 'end' event
        const endCallback = mockFfmpegInstance.on.mock.calls.find(
          (call: any[]) => call[0] === 'end',
        )[1];
        setTimeout(() => endCallback(), 0);
      });

      const result = await service.segmentVideo(mockDto);

      expect(result).toEqual({
        message: 'Video segmented successfully',
        segmentCount: 2,
        outputPath: expect.stringContaining('segments'),
      });

      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFfmpeg).toHaveBeenCalledWith(
        `videos/${mockDto.videoFileName}`,
      );
    });

    it('should handle FFmpeg errors', async () => {
      const mockError = new Error('FFmpeg processing failed');

      // Setup FFmpeg to trigger error
      mockFfmpegInstance.on.mockImplementation(
        (event: string, callback: Function) => {
          if (event === 'error') {
            setTimeout(() => callback(mockError), 0);
          }
          return mockFfmpegInstance;
        },
      );

      mockFfmpegInstance.run.mockImplementation(() => {
        // Trigger the 'error' event
        const errorCallback = mockFfmpegInstance.on.mock.calls.find(
          (call: any[]) => call[0] === 'error',
        )[1];
        setTimeout(() => errorCallback(mockError), 0);
      });

      await expect(service.segmentVideo(mockDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.segmentVideo(mockDto)).rejects.toThrow(
        'FFmpeg error: FFmpeg processing failed',
      );
    });

    it('should handle directory creation errors', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(service.segmentVideo(mockDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.segmentVideo(mockDto)).rejects.toThrow(
        'Failed to create output directory',
      );
    });

    it('should handle file counting errors after segmentation', async () => {
      // Mock directory creation success but file reading failure
      mockFs.readdir.mockRejectedValue(new Error('Cannot read directory'));

      // Setup FFmpeg to trigger end event
      mockFfmpegInstance.on.mockImplementation(
        (event: string, callback: Function) => {
          if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
          return mockFfmpegInstance;
        },
      );

      mockFfmpegInstance.run.mockImplementation(() => {
        const endCallback = mockFfmpegInstance.on.mock.calls.find(
          (call: any[]) => call[0] === 'end',
        )[1];
        setTimeout(() => endCallback(), 0);
      });

      await expect(service.segmentVideo(mockDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.segmentVideo(mockDto)).rejects.toThrow(
        'Failed to count segments',
      );
    });

    it('should use correct FFmpeg options', async () => {
      mockFs.readdir.mockResolvedValue(['segment1.mp4'] as any);

      // Setup successful FFmpeg execution
      mockFfmpegInstance.on.mockImplementation(
        (event: string, callback: Function) => {
          if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
          return mockFfmpegInstance;
        },
      );

      mockFfmpegInstance.run.mockImplementation(() => {
        const endCallback = mockFfmpegInstance.on.mock.calls.find(
          (call: any[]) => call[0] === 'end',
        )[1];
        setTimeout(() => endCallback(), 0);
      });

      await service.segmentVideo(mockDto);

      expect(mockFfmpegInstance.inputOptions).toHaveBeenCalledWith(['-y']);
      expect(mockFfmpegInstance.outputOptions).toHaveBeenCalledWith([
        '-c copy',
        '-f segment',
        '-segment_time 10',
        '-reset_timestamps 1',
      ]);
    });

    it('should create output directory with correct path', async () => {
      mockFs.readdir.mockResolvedValue(['segment1.mp4'] as any);

      mockFfmpegInstance.on.mockImplementation(
        (event: string, callback: Function) => {
          if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
          return mockFfmpegInstance;
        },
      );

      mockFfmpegInstance.run.mockImplementation(() => {
        const endCallback = mockFfmpegInstance.on.mock.calls.find(
          (call: any[]) => call[0] === 'end',
        )[1];
        setTimeout(() => endCallback(), 0);
      });

      await service.segmentVideo(mockDto);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringMatching(/segments[\\\/]test_\d+/),
        { recursive: true },
      );
    });
  });
});
