import { describe, expect, it } from 'vitest';
import { electrificationCatalogueFixture } from '../publish-electrification-data/electrification-data.test-fixture';
import { ElectrificationCatalogueRules } from '../publish-electrification-data/electrification-catalogue.rules';
import { ReadElectrificationV4Snapshot } from './read-electrification-v4-snapshot';
import assert from 'node:assert';
import { ElectrificationTargetValuesRules } from '@tet/backend/plans/ai-plan-import/electrification/extract-plan/electrification-target-values.rules';
import { ElectrificationValueInterpretationRules } from '@tet/backend/plans/ai-plan-import/electrification/extract-plan/electrification-value-interpretation.rules';
import { ElectrificationValueRequest } from '@tet/backend/plans/ai-plan-import/electrification/extract-plan/electrification-value-interpretation.schema';

describe('Relecture des publications antérieures aux définitions importables', () => {
  it('lit Artisans directement et avec une citation IA, sans confondre MWh et mWh', () => {
    const saved = structuredClone(electrificationCatalogueFixture);
    delete saved.engagementsFormat;
    const adapted = ReadElectrificationV4Snapshot.adapt(saved);
    const cible = adapted.engagements.find(({ code }) => code === 'E09')
      ?.cibles[0];
    const energie = adapted.engagements.find(({ code }) => code === 'E10')
      ?.cibles[0];
    assert(cible?.reglesImport && cible.uniteImport && energie);
    expect(
      ElectrificationTargetValuesRules.parse('40 Artisans', [cible])
    ).toEqual(new Map([[cible.key, 40]]));
    expect(ElectrificationTargetValuesRules.parse('40 MWh', [energie])).toEqual(
      new Map([[energie.key, 40]])
    );
    expect(
      ElectrificationTargetValuesRules.parse('40 mWh', [energie])
    ).toBeNull();
    const request: ElectrificationValueRequest = {
      kind: 'target',
      keys: [cible.key],
      label: 'Artisans',
      unit: cible.uniteImport,
      year: 2030,
      source: {
        id: 'cible',
        section: 'A',
        text: 'Accompagner 40 Artisans',
        location: 'Cible',
        links: [],
      },
      targets: [
        {
          key: cible.key,
          unit: cible.uniteImport,
          year: 2030,
          labels: [],
          units: cible.reglesImport.unites,
        },
      ],
    };
    for (const unit of [null, 'Artisans']) {
      expect(
        ElectrificationValueInterpretationRules.normalize(request, [
          {
            key: cible.key,
            number: '40',
            quote: '40 Artisans',
            unit,
            year: null,
          },
        ])
      ).toBe('40');
    }
  });

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
