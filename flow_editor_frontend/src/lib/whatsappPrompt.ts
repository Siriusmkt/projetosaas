export const toWhatsappPrompt = (text: string): string => {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      output.push('');
      continue;
    }
    if (/^[-*]{3,}$/.test(trimmed)) {
      output.push('');
      continue;
    }
    if (trimmed.startsWith('##')) {
      const title = trimmed.replace(/^##+\s*/, '');
      output.push(`*${title}*`);
      continue;
    }
    const withBullets = trimmed.startsWith('- ') ? `• ${trimmed.slice(2)}` : trimmed;
    const withBold = withBullets.replace(/\*\*(.+?)\*\*/g, '*$1*');
    output.push(withBold);
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};
