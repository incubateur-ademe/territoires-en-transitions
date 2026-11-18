import { describe, expect, it } from 'vitest';
import { electrificationCatalogueFixture } from '../publish-electrification-data/electrification-data.test-fixture';
import { ElectrificationCatalogueRules } from '../publish-electrification-data/electrification-catalogue.rules';
import { ReadElectrificationV4Snapshot } from './read-electrification-v4-snapshot';

describe('Relecture des publications antérieures aux définitions importables', () => {
  it('préserve le snapshot et ses identités tout en restituant les règles de lecture historiques', () => {
    const saved = structuredClone(electrificationCatalogueFixture);
    delete saved.engagementsFormat;
    for (const engagement of saved.engagements) {
      delete engagement.libelleSource;
      for (const cible of engagement.cibles) {
        delete cible.uniteImport;
        delete cible.reglesImport;
      }
    }
    const before = JSON.stringify(saved);
    const adapted = ReadElectrificationV4Snapshot.adapt(saved);
    expect(JSON.stringify(saved)).toBe(before);
    expect(adapted.version).toBe(saved.version);
    expect(ElectrificationCatalogueRules.isValid(adapted)).toBe(true);
    expect(
      adapted.engagements.find(({ code }) => code === 'E09')?.cibles[0]
    ).toMatchObject({
      unite: 'nb',
      uniteImport: 'Nombre',
      reglesImport: { annee: 2030 },
    });
    expect(
      adapted.engagements.find(({ code }) => code === 'E07')?.cibles[1]
        .reglesImport?.plafondCible
    ).toBe('total');
  });

  it('ne complète jamais les métadonnées manquantes dans un nouveau catalogue', () => {
    const current = structuredClone(electrificationCatalogueFixture);
    delete current.engagements[0].cibles[0].reglesImport;
    expect(ReadElectrificationV4Snapshot.adapt(current)).toBe(current);
    expect(ElectrificationCatalogueRules.isValid(current)).toBe(false);
  });
});
