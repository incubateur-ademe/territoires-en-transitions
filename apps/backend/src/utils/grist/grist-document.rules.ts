/** Identité d'un document Grist, indépendante de la page affichée et du slug. */
export class GristDocumentRules {
  private static readonly origin = 'https://grist.numerique.gouv.fr';

  static isGristUrl(value: string): boolean {
    try {
      return new URL(value).hostname === new URL(this.origin).hostname;
    } catch {
      return false;
    }
  }

  static getDocumentId(value: string): string | null {
    try {
      const url = new URL(value);
      if (url.origin !== this.origin || url.username || url.password)
        return null;
      const segments = url.pathname.split('/').filter(Boolean);
      const documentId = segments[0] === 'o' ? segments[2] : segments[0];
      if (!documentId || ['api', 'o', 'login', 'signup'].includes(documentId))
        return null;
      return /^[a-zA-Z0-9_-]+$/.test(documentId) ? documentId : null;
    } catch {
      return null;
    }
  }

  static getCommonDocumentId(links: readonly string[]): string | null {
    const ids = new Set(links.map((link) => this.getDocumentId(link)));
    return ids.size === 1 && !ids.has(null) ? [...ids][0] : null;
  }

  static getApiUrl(documentId: string): string {
    return `${this.origin}/api/docs/${encodeURIComponent(documentId)}`;
  }

  static getUrl(documentId: string): string {
    return `${this.origin}/${encodeURIComponent(documentId)}`;
  }
}
