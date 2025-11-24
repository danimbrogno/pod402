import { promises as fsPromises, existsSync } from 'fs';
import { join } from 'path';
import { PassThrough } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import OpenAI from 'openai';
import { StreamAudioContext as WebAudioStreamContext } from 'web-audio-engine';

import { createAmbientAudioCache } from './components/ambientAudioCache';
import { createGetAmbientAudio } from './components/getAmbientAudio';
import { createGetAudioContext } from './components/getAudioContext';
import { createTranscode } from './components/transcode';
import { createFadeOutAndEnd } from './components/fadeOutAndEnd';
import { createGetMeditationText } from './components/narration/components/getMeditationText';
import { createGetPhraseAudio } from './components/narration/components/getPhraseAudio';
import { createGetNarration } from './components/narration/getNarration';
import { createBuildEpisode } from './buildEpisode';
import { getWavHeader } from './components/wav';
import type { Config, StreamAudioContext } from './types';

const ambientAudioCache = createAmbientAudioCache({
  fileExists: existsSync,
  readFile: fsPromises.readFile,
  joinPath: join,
  logger: console,
});

const getAmbientAudio = createGetAmbientAudio({
  readFile: fsPromises.readFile,
  joinPath: join,
  fileExists: existsSync,
  getCachedAmbientAudio: ambientAudioCache.get,
  logger: console,
});

const getAudioContext = createGetAudioContext({
  createContext: () => new WebAudioStreamContext() as StreamAudioContext,
});

const transcode = createTranscode({
  PassThrough,
  createFfmpegCommand: ffmpeg,
  getWavHeader,
  logger: console,
});

const fadeOutAndEnd = createFadeOutAndEnd();

const getMeditationText = createGetMeditationText({
  createChatCompletionStream: (client, params) =>
    client.chat.completions.create(params),
  logger: console,
});

const getPhraseAudio = createGetPhraseAudio({
  createSpeech: (client, params) => client.audio.speech.create(params),
  logger: console,
});

const getNarration = createGetNarration({
  OpenAI,
  getMeditationText,
  getPhraseAudio,
  createAbortController: () => new AbortController(),
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  randomInt: (max) => Math.floor(Math.random() * max),
  logger: console,
});

export const buildEpisode = createBuildEpisode({
  getAudioContext,
  transcode,
  getAmbientAudio,
  getNarration,
  fadeOutAndEnd,
  randomInt: (max) => Math.floor(Math.random() * max),
  logger: console,
});

export const initializeAmbientAudioCache = ambientAudioCache.initialize;
export const getCachedAmbientAudio = ambientAudioCache.get;
export const isCached = ambientAudioCache.isCached;
export const getCacheStats = ambientAudioCache.stats;

export type { Config, StreamAudioContext };
