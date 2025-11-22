import OpenAI from 'openai';
import { Config } from '../../../../../../../interface';

export async function* getMeditationText(
  config: Config,
  openai: OpenAI,
  prompt: string
): AsyncGenerator<string, void, unknown> {
  console.log('[getMeditationText] Starting meditation text generation');
  console.log(
    '[getMeditationText] Prompt:',
    prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
  );

  const stream = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      { role: 'user', content: prompt },
      {
        role: 'system',
        content: config.openai.textInstruction,
      },
    ],
    stream: true,
  });

  console.log('[getMeditationText] Stream started, waiting for chunks...');
  let currentSentence = '';
  let sentenceCount = 0;
  let totalChunks = 0;

  // Helper function to find sentence endings
  // Sentences end with . ! or ? followed by space, newline, or end of string
  const findSentenceEnd = (text: string): number => {
    // Look for sentence-ending punctuation followed by whitespace or end of string
    const sentenceEndRegex = /[.!?](?:\s+|$)/;
    const match = text.match(sentenceEndRegex);
    return match ? match.index! + match[0].length : -1;
  };

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';

    if (content) {
      totalChunks++;
      currentSentence += content;

      // Check for sentence endings
      let sentenceEndIndex = findSentenceEnd(currentSentence);

      while (sentenceEndIndex !== -1) {
        // Extract the complete sentence (everything before the sentence ending)
        const completeSentence = currentSentence
          .substring(0, sentenceEndIndex)
          .trim();

        if (completeSentence) {
          sentenceCount++;
          const preview =
            completeSentence.substring(0, 50) +
            (completeSentence.length > 50 ? '...' : '');
          console.log(
            `[getMeditationText] Sentence ${sentenceCount} yielded (${completeSentence.length} chars): "${preview}"`
          );
          yield completeSentence;
        }

        // Remove the yielded sentence from the buffer
        currentSentence = currentSentence.substring(sentenceEndIndex).trim();

        // Check if there are more sentence endings in the remaining text
        sentenceEndIndex = findSentenceEnd(currentSentence);
      }
    }
  }

  console.log(
    `[getMeditationText] Stream completed. Total chunks received: ${totalChunks}`
  );

  // Yield any remaining text as the final sentence
  const finalSentence = currentSentence.trim();
  if (finalSentence) {
    sentenceCount++;
    const preview =
      finalSentence.substring(0, 50) + (finalSentence.length > 50 ? '...' : '');
    console.log(
      `[getMeditationText] Final sentence ${sentenceCount} yielded (${finalSentence.length} chars): "${preview}"`
    );
    yield finalSentence;
  }

  console.log(
    `[getMeditationText] Completed. Total sentences: ${sentenceCount}`
  );
}
