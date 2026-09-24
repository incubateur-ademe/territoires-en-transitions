import { describe, expect, it } from 'vitest';
import { toAnalyzeFichesInputScope } from './analyze-fiches.input';

describe('full-flow', () => {
  it('--collectivites=12,45,78 cible les fiches de ces trois CT', () => {
    expect(toAnalyzeFichesInputScope(['--collectivites=12,45,78'])).toEqual({
      success: true,
      data: { kind: 'collectivites', collectivites: [12, 45, 78] },
    });
  });

  it('--collectivites=all cible les fiches de toutes les CT', () => {
    expect(toAnalyzeFichesInputScope(['--collectivites=all'])).toEqual({
      success: true,
      data: { kind: 'collectivites', collectivites: 'all' },
    });
  });
});

describe('enjeu', () => {
  it.todo("fixe l'enjeu à ges, seul enjeu analysé");
});

describe('daily-ct-check', () => {
  it('sans argument, lance le passage quotidien', () => {
    expect(toAnalyzeFichesInputScope([])).toEqual({
      success: true,
      data: { kind: 'daily' },
    });
  });
});

describe('arguments', () => {
  it("refuse un identifiant de CT qui n'est pas un entier positif", () => {
    expect(toAnalyzeFichesInputScope(['--collectivites=12,abc'])).toEqual({
      success: false,
      error: { kind: 'invalid_collectivite_id', value: 'abc' },
    });
  });

  it('refuse un identifiant de CT nul', () => {
    expect(toAnalyzeFichesInputScope(['--collectivites=0'])).toEqual({
      success: false,
      error: { kind: 'invalid_collectivite_id', value: '0' },
    });
  });

  it('refuse un identifiant de CT vide entre deux virgules', () => {
    expect(toAnalyzeFichesInputScope(['--collectivites=12,,45'])).toEqual({
      success: false,
      error: { kind: 'invalid_collectivite_id', value: '' },
    });
  });

  it.each([' 12', '1.0', '0x10', '1e2', '012'])(
    "refuse l'identifiant de CT non canonique %j avec sa valeur brute",
    (rawCollectiviteId) => {
      expect(
        toAnalyzeFichesInputScope([`--collectivites=${rawCollectiviteId}`])
      ).toEqual({
        success: false,
        error: { kind: 'invalid_collectivite_id', value: rawCollectiviteId },
      });
    }
  );

  it('refuse --collectivites sans valeur', () => {
    expect(toAnalyzeFichesInputScope(['--collectivites='])).toEqual({
      success: false,
      error: { kind: 'empty_collectivites' },
    });
  });

  it('refuse --collectivites sans signe égal', () => {
    expect(toAnalyzeFichesInputScope(['--collectivites'])).toEqual({
      success: false,
      error: { kind: 'empty_collectivites' },
    });
  });

  it('refuse un argument inconnu', () => {
    expect(toAnalyzeFichesInputScope(['--enjeu=ges'])).toEqual({
      success: false,
      error: { kind: 'unknown_argument', argument: '--enjeu=ges' },
    });
  });

  it('refuse un second argument', () => {
    expect(
      toAnalyzeFichesInputScope(['--collectivites=12', '--collectivites=45'])
    ).toEqual({
      success: false,
      error: { kind: 'unknown_argument', argument: '--collectivites=45' },
    });
  });
});
