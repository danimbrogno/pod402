import OpenAI from 'openai';

export async function* getMeditationText(
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
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  console.log('[getMeditationText] Stream started, waiting for chunks...');
  let currentParagraph = '';
  let paragraphCount = 0;
  let totalChunks = 0;

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';

    if (content) {
      totalChunks++;
      currentParagraph += content;

      // Check for paragraph breaks (double newline)
      // Handle cases where newlines might be split across chunks
      let paragraphEndIndex = currentParagraph.indexOf('\n\n');

      while (paragraphEndIndex !== -1) {
        // Extract the complete paragraph (everything before the double newline)
        const completeParagraph = currentParagraph
          .substring(0, paragraphEndIndex)
          .trim();

        if (completeParagraph) {
          paragraphCount++;
          const preview =
            completeParagraph.substring(0, 50) +
            (completeParagraph.length > 50 ? '...' : '');
          console.log(
            `[getMeditationText] Paragraph ${paragraphCount} yielded (${completeParagraph.length} chars): "${preview}"`
          );
          yield completeParagraph;
        }

        // Remove the yielded paragraph and the double newline from the buffer
        currentParagraph = currentParagraph.substring(paragraphEndIndex + 2);

        // Check if there are more paragraph breaks in the remaining text
        paragraphEndIndex = currentParagraph.indexOf('\n\n');
      }
    }
  }

  console.log(
    `[getMeditationText] Stream completed. Total chunks received: ${totalChunks}`
  );

  // Yield any remaining text as the final paragraph
  const finalParagraph = currentParagraph.trim();
  if (finalParagraph) {
    paragraphCount++;
    const preview =
      finalParagraph.substring(0, 50) +
      (finalParagraph.length > 50 ? '...' : '');
    console.log(
      `[getMeditationText] Final paragraph ${paragraphCount} yielded (${finalParagraph.length} chars): "${preview}"`
    );
    yield finalParagraph;
  }

  console.log(
    `[getMeditationText] Completed. Total paragraphs: ${paragraphCount}`
  );
}
