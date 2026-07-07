import { ParsedM3UEntry } from '@/m3u/types';

export interface IncrementalM3UParserOptions {
  onEntry(entry: ParsedM3UEntry): Promise<void> | void;
  onCategory?(groupTitle: string): Promise<void> | void;
  shouldStop?: () => boolean;
}

export class IncrementalM3UParser {
  async parse(chunks: AsyncIterable<string>, options: IncrementalM3UParserOptions): Promise<void> {
    let buffer = '';
    let pendingInfo: { title: string; attributes: Record<string, string>; groupTitle: string } | undefined;

    for await (const chunk of chunks) {
      if (options.shouldStop?.()) return;
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        pendingInfo = await this.processLine(line.trim(), pendingInfo, options);
        if (options.shouldStop?.()) return;
      }
    }

    if (buffer.trim()) await this.processLine(buffer.trim(), pendingInfo, options);
  }

  private async processLine(
    line: string,
    pendingInfo: { title: string; attributes: Record<string, string>; groupTitle: string } | undefined,
    options: IncrementalM3UParserOptions,
  ) {
    if (!line || line === '#EXTM3U') return pendingInfo;

    if (line.startsWith('#EXTINF')) {
      const info = this.parseExtInf(line);
      await options.onCategory?.(info.groupTitle);
      return info;
    }

    if (line.startsWith('#')) return pendingInfo;

    if (pendingInfo) {
      await options.onEntry({
        title: pendingInfo.title,
        attributes: pendingInfo.attributes,
        groupTitle: pendingInfo.groupTitle,
        url: line,
      });
      return undefined;
    }

    return pendingInfo;
  }

  private parseExtInf(line: string) {
    const commaIndex = line.indexOf(',');
    const metadata = commaIndex >= 0 ? line.slice(0, commaIndex) : line;
    const fallbackTitle = commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : 'Untitled';
    const attributes: Record<string, string> = {};
    const regex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(metadata))) {
      attributes[match[1]] = match[2];
    }

    const title = attributes['tvg-name'] || fallbackTitle || 'Untitled';
    const groupTitle = attributes['group-title'] || 'Uncategorized';
    return { title, attributes, groupTitle };
  }
}
