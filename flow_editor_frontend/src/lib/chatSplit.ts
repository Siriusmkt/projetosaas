export function splitAssistantMessage(text: string, maxLen = 380): string[] {
  const cleaned = (text || "").trim();
  if (!cleaned) return ["..."];
  if (cleaned.length <= maxLen) return [cleaned];

  const paragraphs = cleaned.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  const splitLongParagraph = (paragraph: string): string[] => {
    const sentenceRegex = /[^.!?]+[.!?]+|[^.!?]+$/g;
    const sentences = paragraph.match(sentenceRegex) || [paragraph];
    const parts: string[] = [];
    let buffer = "";
    for (const raw of sentences) {
      const sentence = raw.trim();
      if (!sentence) continue;
      if (!buffer) {
        buffer = sentence;
        continue;
      }
      if ((buffer + " " + sentence).length <= maxLen) {
        buffer = buffer + " " + sentence;
      } else {
        parts.push(buffer);
        buffer = sentence;
      }
    }
    if (buffer) parts.push(buffer);
    return parts.length ? parts : [paragraph];
  };

  for (const paragraph of paragraphs) {
    const para = paragraph.trim();
    if (!para) continue;
    const parts = para.length > maxLen ? splitLongParagraph(para) : [para];
    for (const part of parts) {
      const withSep = current ? `${current}\n\n${part}` : part;
      if (withSep.length <= maxLen) {
        current = withSep;
      } else {
        flush();
        current = part;
      }
    }
  }

  flush();
  return chunks.length ? chunks : [cleaned];
}
