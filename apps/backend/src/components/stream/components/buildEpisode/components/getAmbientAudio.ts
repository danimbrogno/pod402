import { existsSync } from 'fs';
import { promises as fsPromises } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Config } from '../../../../../interface';
import {
  getCachedAmbientAudio,
  isCached,
} from './ambientAudioCache';

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve assets directory - works in both dev and production
// In dev: __dirname = apps/backend/src, so join(__dirname, '../assets/background') works
// In production: adjust path as needed
let ASSETS_DIR = join(__dirname, '../../../../../../assets/background');

export const getAmbientAudio = async (
  config: Config,
  context: AudioContext,
  destination: AudioNode,
  fileNum: string
) => {
  const fileName = `${String(fileNum).padStart(3, '0')}.wav`;
  const normalizedFileNum = String(fileNum).padStart(3, '0');

  try {
    const { levels } = config;
    let arrayBuffer: ArrayBuffer;

    // Try to get from cache first
    const cachedAudio = getCachedAmbientAudio(normalizedFileNum);
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
      const filePath = join(ASSETS_DIR, fileName);

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
    console.log(
      `[getAmbientAudio] Decoded ${fileName} in ${decodeTime}ms`
    );

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

  //   try {
  //     // Check if file exists
  //     const stats = statSync(filePath);
  //     const fileSize = stats.size;

  //     // Parse range header for partial content support
  //     const range = req.headers.range;

  //     let fileStream: ReadStream;

  //     if (range) {
  //       // Parse range header (e.g., "bytes=0-1023")
  //       const parts = range.replace(/bytes=/, '').split('-');
  //       const start = parseInt(parts[0], 10);
  //       const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  //       const chunksize = end - start + 1;

  //       // Set headers for partial content
  //       res.writeHead(206, {
  //         'Content-Range': `bytes ${start}-${end}/${fileSize}`,
  //         'Accept-Ranges': 'bytes',
  //         'Content-Length': chunksize,
  //         'Content-Type': 'audio/wav',
  //       });

  //       // Create stream for the requested range
  //       fileStream = createReadStream(filePath, { start, end });
  //     } else {
  //       // Send entire file
  //       res.writeHead(200, {
  //         'Content-Length': fileSize,
  //         'Content-Type': 'audio/wav',
  //         'Accept-Ranges': 'bytes',
  //       });

  //       fileStream = createReadStream(filePath);
  //     }
  //     fileStream.pipe(res);
  //   } catch (error) {
  //     res.status(404).json({ error: 'File not found' });
  //   }
};
