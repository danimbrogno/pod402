import { describe, expect, it, vi } from 'vitest';
import { createTranscode } from '../components/transcode';
import { createTestConfig } from '../test-utils/createTestConfig';

describe('transcode', () => {
  it('pipes audio through ffmpeg with the expected configuration', () => {
    const pushedHeaders: Uint8Array[] = [];
    const PassThrough = vi
      .fn()
      .mockImplementation(
        function MockPassThrough(this: { push: (chunk: Uint8Array) => void }) {
          this.push = (chunk: Uint8Array) => {
            pushedHeaders.push(chunk);
          };
        }
      );

    const handlers: Record<string, (arg: any) => void> = {};
    const ffmpegCommand = {
      setFfmpegPath: vi.fn().mockReturnThis(),
      setFfprobePath: vi.fn().mockReturnThis(),
      toFormat: vi.fn().mockReturnThis(),
      on: vi.fn().mockImplementation(function (event: string, handler: any) {
        handlers[event] = handler;
        return this;
      }),
    };

    const transcode = createTranscode({
      PassThrough: PassThrough as unknown as typeof import('stream').PassThrough,
      createFfmpegCommand: vi.fn(() => ffmpegCommand) as unknown as typeof import('fluent-ffmpeg'),
      getWavHeader: vi.fn(() => new Uint8Array([1, 2, 3])),
      logger: { log: vi.fn(), error: vi.fn() },
    });

    const result = transcode(
      createTestConfig(),
      {
        pipe: vi.fn(() => ({})),
      } as any
    );

    expect(PassThrough).toHaveBeenCalled();
    expect(pushedHeaders[0]).toEqual(new Uint8Array([1, 2, 3]));
    expect(ffmpegCommand.setFfmpegPath).toHaveBeenCalledWith('/bin/ffmpeg');
    expect(ffmpegCommand.setFfprobePath).toHaveBeenCalledWith('/bin/ffprobe');
    expect(result).toBe(ffmpegCommand);

    handlers.error?.(new Error('Output stream closed'));
    expect(ffmpegCommand.on).toHaveBeenCalledWith('progress', expect.any(Function));
  });
});
