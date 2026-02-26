import type { SourceRef } from '../types';

export interface CleanResult {
  cleanText: string;
  statuses: string[];
}

export function cleanStatusMarkers(text: string): CleanResult {
  const statuses: string[] = [];
  
  const cleanText = text
    .replace(/\[\[STATUS:([^\]]+)\]\]/g, (_, status) => {
      statuses.push(status.trim());
      return '';
    })
    .replace(/\[\[PORTA:[^\]]*\]\]/g, '')
    .replace(/\[\[COMPETITOR:[^\]]*\]\]/g, '')
    .replace(/\[\[[A-Z_]+:[^\n]*?\]\]/g, '')
    .replace(/^(\s*\]\s*\n)+/, '')
    .replace(/^\s*\]/, '')
    .replace(/^\s*\n/gm, '\n')
    .trim();

  return { cleanText, statuses };
}

export function extractAllLinksFromMarkdown(md: string): SourceRef[] {
  const links: SourceRef[] = [];
  const seen = new Set<string>();
  
  // Match markdown links
  const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownRegex.exec(md)) !== null) {
    const [, text, url] = match;
    if (!seen.has(url)) {
      seen.add(url);
      links.push({ text: text.trim(), url: url.trim() });
    }
  }
  
  // Match plain URLs
  const urlRegex = /https?:\/\/[^\s\)\]\n]+/g;
  while ((match = urlRegex.exec(md)) !== null) {
    const url = match[0];
    if (!seen.has(url)) {
      seen.add(url);
      links.push({ text: url, url });
    }
  }
  
  return links;
}

export function formatSourcesForExport(links: SourceRef[]): string {
  if (links.length === 0) return '';
  
  return `

---

## 📚 Fontes Consultadas

${links.map((link, i) => `${i + 1}. [${link.text}](${link.url})`).join('\n')}
`;
}

export function cleanTitle(title: string | null | undefined): string {
  if (!title) return 'Nova Investigação';
  
  return title
    .replace(/\.{3}$/, '')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractSources(text: string): SourceRef[] {
  return extractAllLinksFromMarkdown(text);
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/#+\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanSuggestionText(text: string): string {
  return text
    .replace(/^["']|["']$/g, '')
    .replace(/\.$/, '')
    .trim();
}

export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

export function extractCompanyName(title: string | null | undefined): string {
  if (!title) return 'Empresa';
  
  const patterns = [
    /completa?\s+d[oa]s?\s+(.*)/i,
    /(?:empresa|grupo|companhia)\s+(.*)/i,
    /(?:investigar?|analisar?|pesquisar?)\s+(?:a\s+|o\s+)?(.*)/i,
    /(?:sobre\s+(?:a|o)\s+)(.*)/i,
    /(?:dossie?\s+d[oa]s?\s+)(.*)/i,
    /(?:capivara\s+d[oa]s?\s+)(.*)/i,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim().replace(/\.{3}$/, '').trim();
      if (name.length > 2 && name.length < 60) return name;
    }
  }
  
  return title.replace(/\.{3}$/, '').trim();
}
