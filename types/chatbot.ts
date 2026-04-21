export interface ParseResult {
  items: ParsedItem[];
  rawText: string;
  parsedAt: string;
  modelUsed?: string;  // ← novo
}
