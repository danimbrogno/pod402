import { existsSync } from 'fs';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { Config } from '../../../../../interface';
import { getCachedAmbientAudio } from './ambientAudioCache';
import { getAssetsDir } from '../../../../../utils/getAssetsDir';
import { logger } from '../../../../../utils/logger';

const ASSETS_DIR = getAssetsDir();

export const getAmbientAudio = async (
  config: Config,
  context: AudioContext,
  destination: AudioNode,
  fileNum: string
) => {
  const normalizedFileNum = String(fileNum).padStart(3, '0');
  const fileNumWithSuffix = `${normalizedFileNum}${
    config.ambience.quality === 'dev' ? '_dev' : ''
  }`;
  const fileName = `${fileNumWithSuffix}.wav`;

  try {
    const { levels } = config;
    let arrayBuffer: ArrayBuffer;

    // Try to get from cache first
    const cachedAudio = getCachedAmbientAudio(fileNumWithSuffix);
    if (cachedAudio) {
      logger.debug(`Using cached audio`, {
        component: 'getAmbientAudio',
        fileName,
      });
      arrayBuffer = cachedAudio;
    } else {
      // Fallback to disk if not cached
      logger.debug(`Cache miss, loading from disk`, {
        component: 'getAmbientAudio',
        fileName,
      });
      const filePath = join(ASSETS_DIR, 'ambient', fileName);

      if (!existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`);
      }

      // Read the file from disk into a Buffer
      // NOTE: This loads the entire file into memory. For large files (30-94MB), this is necessary
      // because decodeAudioData requires the complete file to parse headers and decode the audio.
      const fileBuffer = await fsPromises.readFile(filePath);

      // Convert Node.js Buffer to ArrayBuffer for decodeAudioData
      arrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      );
    }

    // Decode the audio data into an AudioBuffer
    const decodeStartTime = Date.now();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    const decodeTime = Date.now() - decodeStartTime;
    logger.debug(`Audio decoded`, {
      component: 'getAmbientAudio',
      fileName,
      decodeTime: `${decodeTime}ms`,
      duration: `${audioBuffer.duration.toFixed(2)}s`,
    });

    // Create and configure the buffer source
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;

    const gain = context.createGain();
    gain.gain.value = levels.ambience;
    source.connect(gain);
    gain.connect(destination);
    source.start(context.currentTime);

    logger.info(`Ambient audio started`, {
      component: 'getAmbientAudio',
      fileName,
      gain: levels.ambience,
    });

    return source;
  } catch (error) {
    logger.error(`Failed to load ambient audio`, error, {
      component: 'getAmbientAudio',
      fileName,
    });
    throw new Error(
      `Failed to load audio file ${fileName}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
