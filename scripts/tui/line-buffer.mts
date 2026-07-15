// Ring buffer de lignes alimenté par des chunks bruts : découpe en lignes en
// conservant le reliquat de ligne incomplète entre deux chunks, strippe le \r
// final (CRLF) et plafonne la mémoire en éjectant les lignes les plus
// anciennes. Aucune dépendance : testable tel quel.
export class LineBuffer {
  #lines: string[] = [];
  #pending = '';
  #maxLines: number;

  constructor(maxLines: number) {
    this.#maxLines = maxLines;
  }

  get length(): number {
    return this.#lines.length;
  }

  slice(start: number, end: number): string[] {
    return this.#lines.slice(start, end);
  }

  // Retourne true si au moins une ligne complète a été ajoutée — le signal
  // qu'un re-rendu vaut le coup.
  push(chunk: Buffer | string): boolean {
    this.#pending += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    const parts = this.#pending.split('\n');
    this.#pending = parts.pop() ?? '';
    if (!parts.length) return false;
    for (const part of parts) this.#lines.push(part.replace(/\r$/, ''));
    this.#cap();
    return true;
  }

  pushLine(line: string): void {
    this.#lines.push(line);
    this.#cap();
  }

  #cap(): void {
    if (this.#lines.length > this.#maxLines)
      this.#lines.splice(0, this.#lines.length - this.#maxLines);
  }
}
