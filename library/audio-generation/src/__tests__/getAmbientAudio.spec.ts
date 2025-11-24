import { describe, expect, it, vi } from 'vitest';
import { createGetAmbientAudio } from '../components/getAmbientAudio';
import { createTestConfig } from '../test-utils/createTestConfig';

const createAudioGraph = () => {
  const destination = {} as AudioNode;
  const gainNode = {
    gain: { value: 0 },
    connect: vi.fn().mockReturnValue(undefined),
  } as unknown as GainNode;
  const source = {
    connect: vi.fn().mockReturnValue(undefined),
    start: vi.fn(),
    loop: false,
    buffer: null as AudioBuffer | null,
  } as unknown as AudioBufferSourceNode;
  const context = {
    currentTime: 123,
    decodeAudioData: vi.fn().mockResolvedValue({
      duration: 2,
      sampleRate: 44100,
      numberOfChannels: 2,
    }),
    createBufferSource: vi.fn(() => source),
    createGain: vi.fn(() => gainNode),
  } as unknown as AudioContext;

  return { context, gainNode, source, destination };
};

describe('getAmbientAudio', () => {
  it('prefers cached audio over disk IO', async () => {
    const cached = new ArrayBuffer(8);
    const deps = {
      readFile: vi.fn(),
      joinPath: vi.fn(),
      fileExists: vi.fn(),
      getCachedAmbientAudio: vi.fn(() => cached),
      logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
    };

    const getAmbientAudio = createGetAmbientAudio(deps);
    const { context, destination, source } = createAudioGraph();
    await getAmbientAudio(
      createTestConfig({ ambience: { quality: 'prod' } }),
      context,
      destination,
      '1'
    );

    expect(deps.readFile).not.toHaveBeenCalled();
    expect(context.decodeAudioData).toHaveBeenCalledWith(cached);
    expect(source.start).toHaveBeenCalledWith(context.currentTime);
  });

  it('loads from disk when cache miss occurs', async () => {
    const fileBuffer = Buffer.from('ambient-audio');
    const deps = {
      readFile: vi.fn().mockResolvedValue(fileBuffer),
      joinPath: vi.fn((...parts: string[]) => parts.join('/')),
      fileExists: vi.fn(() => true),
      getCachedAmbientAudio: vi.fn(() => null),
      logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
    };

    const getAmbientAudio = createGetAmbientAudio(deps);
    const { context, destination } = createAudioGraph();
    await getAmbientAudio(
      createTestConfig({ assetsDir: '/assets', ambience: { quality: 'prod' } }),
      context,
      destination,
      '2'
    );

    expect(deps.readFile).toHaveBeenCalledWith('/assets/ambient/002.wav');
    expect(context.decodeAudioData).toHaveBeenCalled();
  });

  it('throws a descriptive error when the file is missing', async () => {
    const deps = {
      readFile: vi.fn(),
      joinPath: vi.fn((...parts: string[]) => parts.join('/')),
      fileExists: vi.fn(() => false),
      getCachedAmbientAudio: vi.fn(() => null),
      logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
    };

    const getAmbientAudio = createGetAmbientAudio(deps);
    const { context, destination } = createAudioGraph();

    await expect(
      getAmbientAudio(
        createTestConfig({ assetsDir: '/assets' }),
        context,
        destination,
        '3'
      )
    ).rejects.toThrow(/Audio file not found/);
  });
});
