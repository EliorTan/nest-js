import { BadRequestException } from '@nestjs/common';
import { VideoValidationPipe } from './video-validation.pipe';

describe('VideoValidationPipe', () => {
  let pipe: VideoValidationPipe;

  beforeEach(() => {
    pipe = new VideoValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    it('should pass validation for valid mp4 file', () => {
      const input = { videoFileName: 'test.mp4' };
      expect(pipe.transform(input)).toEqual(input);
    });

    it('should pass validation for valid avi file', () => {
      const input = { videoFileName: 'test.avi' };
      expect(pipe.transform(input)).toEqual(input);
    });

    it('should pass validation for valid mov file', () => {
      const input = { videoFileName: 'test.mov' };
      expect(pipe.transform(input)).toEqual(input);
    });

    it('should pass validation for valid mkv file', () => {
      const input = { videoFileName: 'test.mkv' };
      expect(pipe.transform(input)).toEqual(input);
    });

    it('should pass validation for valid webm file', () => {
      const input = { videoFileName: 'test.webm' };
      expect(pipe.transform(input)).toEqual(input);
    });

    it('should handle case insensitive extensions', () => {
      const input = { videoFileName: 'test.MP4' };
      expect(pipe.transform(input)).toEqual(input);
    });

    it('should throw BadRequestException when videoFileName is missing', () => {
      const input = {};
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
      expect(() => pipe.transform(input)).toThrow('Video file is required');
    });

    it('should throw BadRequestException when videoFileName is null', () => {
      const input = { videoFileName: null };
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
      expect(() => pipe.transform(input)).toThrow('Video file is required');
    });

    it('should throw BadRequestException when videoFileName is undefined', () => {
      const input = { videoFileName: undefined };
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
      expect(() => pipe.transform(input)).toThrow('Video file is required');
    });

    it('should throw BadRequestException for invalid file extension', () => {
      const input = { videoFileName: 'test.txt' };
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
      expect(() => pipe.transform(input)).toThrow(
        'Invalid file extension. Allowed: .mp4, .avi, .mov, .mkv, .webm',
      );
    });

    it('should throw BadRequestException for file without extension', () => {
      const input = { videoFileName: 'test' };
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
      expect(() => pipe.transform(input)).toThrow(
        'Invalid file extension. Allowed: .mp4, .avi, .mov, .mkv, .webm',
      );
    });

    it('should throw BadRequestException for unsupported video format', () => {
      const input = { videoFileName: 'test.wmv' };
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
      expect(() => pipe.transform(input)).toThrow(
        'Invalid file extension. Allowed: .mp4, .avi, .mov, .mkv, .webm',
      );
    });
  });
});
