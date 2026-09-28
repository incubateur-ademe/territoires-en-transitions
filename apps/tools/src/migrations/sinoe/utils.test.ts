import { describe, expect, it } from 'vitest';
import {
  chunk,
  detectTypeFichier,
  parseCommunesRecords,
  parseEpciRecords,
  toSinoeId,
  toSiren,
} from './utils';

describe('Import typologie SINOE', () => {
  it('convertit un code SINOE en id interne', () => {
    expect(toSinoeId('R2')).toBe('rural_disperse');
    expect(toSinoeId(' M1 ')).toBe('mixte_urbain');
    expect(toSinoeId('NP')).toBeNull();
    expect(() => toSinoeId('X9')).toThrow(/inconnu/);
  });

  it('ignore les lignes de typologie non précisée', () => {
    const { rows, invalides } = parseCommunesRecords([
      { code_commune: '01001', code_typologie: 'NP' },
      { code_commune: '01002', code_typologie: 'U' },
    ]);
    expect(rows).toEqual([{ cle: '01002', sinoeId: 'urbain' }]);
    expect(invalides).toEqual([]);
  });

  it("extrait le SIREN d'un SIREN ou d'un SIRET", () => {
    expect(toSiren('244900015')).toBe('244900015');
    expect(toSiren('24710029000011')).toBe('247100290');
    expect(toSiren('2447100')).toBeNull();
    expect(toSiren('')).toBeNull();
  });

  it('extrait le SIREN malgré un formatage interne (espaces, tirets)', () => {
    expect(toSiren('244 900 015')).toBe('244900015');
    expect(toSiren('24710029000011')).toBe('247100290');
  });

  it('associe les communes à leur typologie par code commune', () => {
    const { rows, invalides } = parseCommunesRecords([
      { code_commune: '01001', code_typologie: 'R2' },
      { code_commune: '2A004', code_typologie: 'U' },
      { code_commune: '', code_typologie: 'U' },
    ]);
    expect(rows).toEqual([
      { cle: '01001', sinoeId: 'rural_disperse' },
      { cle: '2A004', sinoeId: 'urbain' },
    ]);
    expect(invalides).toEqual([
      { ligne: 4, raison: 'identifiant de collectivité invalide' },
    ]);
  });

  it('associe les EPCI à leur typologie par SIREN', () => {
    const { rows } = parseEpciRecords([
      { SIRET: '244900015', code_typologie: 'U' },
      { SIRET: '24710029000011', code_typologie: 'M2' },
    ]);
    expect(rows).toEqual([
      { cle: '244900015', sinoeId: 'urbain' },
      { cle: '247100290', sinoeId: 'mixte_rural' },
    ]);
  });

  it('capture un code_typologie inconnu comme ligne invalide plutôt que de planter', () => {
    const { rows, invalides } = parseCommunesRecords([
      { code_commune: '01001', code_typologie: 'R2' },
      { code_commune: '01002', code_typologie: 'X9' },
      { code_commune: '01003', code_typologie: 'U' },
    ]);
    expect(rows).toEqual([
      { cle: '01001', sinoeId: 'rural_disperse' },
      { cle: '01003', sinoeId: 'urbain' },
    ]);
    expect(invalides).toEqual([
      { ligne: 3, raison: expect.stringMatching(/inconnu/) },
    ]);
  });

  it('capture un code_typologie inconnu pour les EPCI comme ligne invalide', () => {
    const { rows, invalides } = parseEpciRecords([
      { SIRET: '244900015', code_typologie: 'X9' },
    ]);
    expect(rows).toEqual([]);
    expect(invalides).toEqual([
      { ligne: 2, raison: expect.stringMatching(/inconnu/) },
    ]);
  });

  it('détecte le type de fichier depuis les colonnes', () => {
    expect(
      detectTypeFichier([
        'annee',
        'code_commune',
        'libelle_commune',
        'code_typologie',
        'libelle_typologie',
      ])
    ).toBe('communes');
    expect(
      detectTypeFichier([
        'annee',
        'code_acteur',
        'SIRET',
        'libelle_acteur',
        'code_typologie',
      ])
    ).toBe('epci');
    expect(() => detectTypeFichier(['annee', 'code_typologie'])).toThrow(
      /non reconnu/
    );
    expect(() =>
      detectTypeFichier(['code_commune', 'SIRET', 'code_typologie'])
    ).toThrow(/non reconnu/);
    expect(() => detectTypeFichier(['code_commune'])).toThrow(/code_typologie/);
  });

  it('découpe en paquets', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
