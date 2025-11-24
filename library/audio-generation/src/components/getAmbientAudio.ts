import { existsSync } from 'fs';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { Config } from '../types';
import { getCachedAmbientAudio, isCached } from './ambientAudioCache';

export const getAmbientAudio = async (
  config: Config,
  context: AudioContext,
  destination: AudioNode,
  fileNum: string
) => {
  const ASSETS_DIR = config.assetsDir;
  const normalizedFileNum = String(fileNum).padStart(3, '0');
  // Construct filename based on quality setting (dev uses _dev suffix)
  const fileNumWithSuffix = `${normalizedFileNum}${
    config.ambience.quality === 'dev' ? '_dev' : ''
  }`;
  const fileName = `${fileNumWithSuffix}.wav`;

  try {
    const { levels } = config;
    let arrayBuffer: ArrayBuffer;

    // Try to get from cache first (cache uses fileNum with suffix as key)
    const cachedAudio = getCachedAmbientAudio(fileNumWithSuffix);
    if (cachedAudio) {
      console.log(
        `[getAmbientAudio] Using cached audio for ${fileName} (instant load)`
      );
      arrayBuffer = cachedAudio;
    } else {
      // Fallback to disk if not cached
      console.log(
        `[getAmbientAudio] Cache miss for ${fileName}, loading from disk...`
      );
      const filePath = join(ASSETS_DIR, 'ambient', fileName);

      // Check if file exists
      if (!existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`);
      }

      // Read the file from disk into a Buffer
      // NOTE: This loads the entire file into memory. For large files (30-94MB), this is necessary
      // because decodeAudioData requires the complete file to parse headers and decode the audio.
      // The decoded AudioBuffer will also be held in memory for playback.
      const fileBuffer = await fsPromises.readFile(filePath);

      // Convert Node.js Buffer to ArrayBuffer for decodeAudioData
      // Create a new ArrayBuffer copy to ensure proper memory management
      // This is more reliable than using buffer.slice() which might reference a larger underlying buffer
      arrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      );
    }

    // Decode the audio data into an AudioBuffer
    // This will hold the decoded PCM audio data in memory
    // Decoding is fast when the data is already in memory (cached)
    const decodeStartTime = Date.now();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    const decodeTime = Date.now() - decodeStartTime;
    console.log(`[getAmbientAudio] Decoded ${fileName} in ${decodeTime}ms`);

    // Create and configure the buffer source
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;

    const gain = context.createGain();
    gain.gain.value = levels.ambience;
    source.connect(gain);
    gain.connect(destination);
    const currentTime = context.currentTime;
    source.start(currentTime);

    return source;
  } catch (error) {
    throw new Error(
      `Failed to load audio file ${fileName}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
