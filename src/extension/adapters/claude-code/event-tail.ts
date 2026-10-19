import { closeSync, openSync, readSync, statSync } from 'node:fs';

const NEWLINE = 0x0a;
/** Anything beyond this in one poll is skipped rather than replayed. */
const MAX_READ_BYTES = 1_000_000;

/**
 * Follows a file that other processes append to, like `tail -f`, and reports each new
 * line. Polling is used because file watchers are unreliable across platforms and the
 * cost of one stat call every few hundred milliseconds is negligible.
 * Only lines written after start() are reported.
 */
export class EventTail {
  private offset = 0;
  private pending: Buffer = Buffer.alloc(0);
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly file: string,
    private readonly onLine: (line: string) => void,
    private readonly intervalMs = 250,
  ) {}

  start(): void {
    this.offset = this.size() ?? 0;
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  poll(): void {
    const size = this.size();
    if (size === undefined) return;
    if (size < this.offset) {
      // The file was truncated (the hook trims it when it grows large).
      this.offset = 0;
      this.pending = Buffer.alloc(0);
    }
    const length = size - this.offset;
    if (length <= 0) return;
    if (length > MAX_READ_BYTES) {
      this.offset = size;
      return;
    }

    const chunk = this.read(this.offset, length);
    if (!chunk) return;
    this.offset += chunk.length;
    this.emitLines(Buffer.concat([this.pending, chunk]));
  }

  private emitLines(data: Buffer): void {
    const lastNewline = data.lastIndexOf(NEWLINE);
    if (lastNewline === -1) {
      this.pending = data;
      return;
    }
    // Keep any incomplete trailing line as raw bytes so multi-byte characters stay intact.
    this.pending = data.subarray(lastNewline + 1);
    for (const line of data.subarray(0, lastNewline).toString('utf8').split('\n')) {
      if (line.trim() !== '') this.onLine(line);
    }
  }

  private size(): number | undefined {
    try {
      return statSync(this.file).size;
    } catch {
      return undefined;
    }
  }

  private read(position: number, length: number): Buffer | undefined {
    let fd: number | undefined;
    try {
      fd = openSync(this.file, 'r');
      const buffer = Buffer.alloc(length);
      const bytesRead = readSync(fd, buffer, 0, length, position);
      return buffer.subarray(0, bytesRead);
    } catch {
      return undefined;
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
  }
}
