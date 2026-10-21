import { describe, expect, it } from 'vitest';
import { cleanText } from './clean-text';

describe('cleanText', () => {
  it('remplace les ligatures et les espaces insécables, écrase les espaces multiples', () => {
    expect(cleanText('Ef\uFB01cacité\u00A0  énergétique')).toBe(
      'Efficacité énergétique'
    );
  });

  it('retire les caractères de contrôle et les demi-paires que Postgres refuse en jsonb', () => {
    const text = cleanText('Iso\u0000ler\u001F\uD800 \uD83C\uDF31');

    expect(text).toBe('Isoler\uFFFD \uD83C\uDF31');
    expect(() => JSON.parse(JSON.stringify(text))).not.toThrow();
  });

  it('garde les tabulations de tête, qui séparent une colonne vide', () => {
    expect(cleanText('\t\tValeur\t')).toBe('\t\tValeur\t');
  });
});
