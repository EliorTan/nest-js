import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

interface MockHttpArgumentsHost {
  getRequest: jest.MockedFunction<() => any>;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    guard = new AuthGuard();

    mockExecutionContext = {
      switchToHttp: jest.fn(),
    } as jest.Mocked<ExecutionContext>;
  });

  afterEach(() => {
    delete process.env.API_KEY;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when valid API key is provided', () => {
      const mockRequest = {
        headers: {
          'x-api-key': 'valid-key',
        },
      };

      process.env.API_KEY = 'valid-key';

      const mockHttpArgumentsHost: MockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      mockExecutionContext.switchToHttp.mockReturnValue(
        mockHttpArgumentsHost as any,
      );

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      expect(mockHttpArgumentsHost.getRequest).toHaveBeenCalled();
    });

    it('should return true when valid API key matches default key', () => {
      const mockRequest = {
        headers: {
          'x-api-key': 'key',
        },
      };

      const mockHttpArgumentsHost: MockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      mockExecutionContext.switchToHttp.mockReturnValue(
        mockHttpArgumentsHost as any,
      );

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when no API key is provided', () => {
      const mockRequest = {
        headers: {},
      };

      const mockHttpArgumentsHost: MockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      mockExecutionContext.switchToHttp.mockReturnValue(
        mockHttpArgumentsHost as any,
      );

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Invalid API key',
      );
    });

    it('should throw UnauthorizedException when invalid API key is provided', () => {
      const mockRequest = {
        headers: {
          'x-api-key': 'invalid-key',
        },
      };

      process.env.API_KEY = 'valid-key';

      const mockHttpArgumentsHost: MockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      mockExecutionContext.switchToHttp.mockReturnValue(
        mockHttpArgumentsHost as any,
      );

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Invalid API key',
      );
    });

    it('should throw UnauthorizedException when API key is empty string', () => {
      const mockRequest = {
        headers: {
          'x-api-key': '',
        },
      };

      const mockHttpArgumentsHost: MockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      mockExecutionContext.switchToHttp.mockReturnValue(
        mockHttpArgumentsHost as any,
      );

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Invalid API key',
      );
    });

    it('should handle case sensitive API key comparison', () => {
      const mockRequest = {
        headers: {
          'x-api-key': 'Valid-Key',
        },
      };

      process.env.API_KEY = 'valid-key';

      const mockHttpArgumentsHost: MockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      mockExecutionContext.switchToHttp.mockReturnValue(
        mockHttpArgumentsHost as any,
      );

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should work with custom environment API key', () => {
      const mockRequest = {
        headers: {
          'x-api-key': 'custom-secret-key-123',
        },
      };

      process.env.API_KEY = 'custom-secret-key-123';

      const mockHttpArgumentsHost: MockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      mockExecutionContext.switchToHttp.mockReturnValue(
        mockHttpArgumentsHost as any,
      );

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
