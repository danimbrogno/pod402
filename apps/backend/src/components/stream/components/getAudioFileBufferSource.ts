import { existsSync } from 'fs';
import { promises as fsPromises } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve assets directory - works in both dev and production
// In dev: __dirname = apps/backend/src, so join(__dirname, '../assets/background') works
// In production: adjust path as needed
let ASSETS_DIR = join(__dirname, '../../assets/background');
// If assets don't exist in relative path (production build), try absolute from project root
if (!existsSync(ASSETS_DIR)) {
  // In production, the file is in dist/apps/backend, so go up to workspace root
  ASSETS_DIR = join(__dirname, '../../../../../apps/backend/assets/background');
}
export const getAudioFileBufferSource = async (
  context: AudioContext,
  fileNum: string
) => {
  const fileName = `${String(fileNum).padStart(3, '0')}.wav`;
  const filePath = join(ASSETS_DIR, fileName);

  try {
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
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    // Decode the audio data into an AudioBuffer
    // This will hold the decoded PCM audio data in memory
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    // Create and configure the buffer source
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;

    return source;
  } catch (error) {
    throw new Error(
      `Failed to load audio file ${fileName}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
