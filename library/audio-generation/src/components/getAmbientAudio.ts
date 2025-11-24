import { Config } from '../types';

type ReadFileFn = typeof import('fs/promises').readFile;
type JoinFn = typeof import('path')['join'];
type ExistsFn = typeof import('fs').existsSync;

export type GetAmbientAudioDependencies = {
  readFile: ReadFileFn;
  joinPath: JoinFn;
  fileExists: ExistsFn;
  getCachedAmbientAudio: (fileNum: string) => ArrayBuffer | null;
  logger?: Pick<typeof console, 'log' | 'warn' | 'error'>;
};

export const createGetAmbientAudio = (deps: GetAmbientAudioDependencies) => {
  const logger = deps.logger ?? console;

  return async (
    config: Config,
    context: AudioContext,
    destination: AudioNode,
    fileNum: string
  ): Promise<AudioBufferSourceNode> => {
    const ASSETS_DIR = config.assetsDir;
    const normalizedFileNum = String(fileNum).padStart(3, '0');
    const fileNumWithSuffix = `${normalizedFileNum}${
      config.ambience.quality === 'dev' ? '_dev' : ''
    }`;
    const fileName = `${fileNumWithSuffix}.wav`;

    try {
      const { levels } = config;
      let arrayBuffer: ArrayBuffer;

      const cachedAudio = deps.getCachedAmbientAudio(fileNumWithSuffix);
      if (cachedAudio) {
        logger.log(
          `[getAmbientAudio] Using cached audio for ${fileName} (instant load)`
        );
        arrayBuffer = cachedAudio;
      } else {
        logger.log(
          `[getAmbientAudio] Cache miss for ${fileName}, loading from disk...`
        );
        const filePath = deps.joinPath(ASSETS_DIR, 'ambient', fileName);

        if (!deps.fileExists(filePath)) {
          throw new Error(`Audio file not found: ${filePath}`);
        }

        const fileBuffer = await deps.readFile(filePath);
        arrayBuffer = fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength
        );
      }

      const decodeStartTime = Date.now();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      const decodeTime = Date.now() - decodeStartTime;
      logger.log(`[getAmbientAudio] Decoded ${fileName} in ${decodeTime}ms`);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      const gain = context.createGain();
      gain.gain.value = levels.ambience;
      source.connect(gain);
      gain.connect(destination);
      source.start(context.currentTime);

      return source;
    } catch (error) {
      throw new Error(
        `Failed to load audio file ${fileName}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };
};
