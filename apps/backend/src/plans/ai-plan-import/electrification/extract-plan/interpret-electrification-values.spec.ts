import assert from 'node:assert';
import { ElectrificationConfig } from '@tet/domain/plans';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { emptyTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { buildDocument } from '../../pipeline/document/document-page';
import { AiPlanImportProfileEnum } from '../../models/import-profile';
import { electrificationExtractionCheckpointSchema } from './electrification-extraction-checkpoint.schema';
import { ElectrificationExtractionRules } from './electrification-extraction.rules';
import { ElectrificationImportContractRules } from '../validate-import/electrification-import-contract.rules';
import { ElectrificationValueInterpretationRules } from './electrification-value-interpretation.rules';
import { InterpretElectrificationValues } from './interpret-electrification-values';

const engagementLabel = 'Rénover le parc, dont les écoles.';
const catalogue: ElectrificationConfig = {
  version: 'catalogue-dynamique',
  engagementsFormat: 2,
  axes: [{ numero: 13, titre: 'Rénovation' }],
  sousAxes: [],
  fiches: { actions: [], indicateurs: [] },
  engagements: [
    {
      code: 'RENOVATION',
      axeNumero: 13,
      actionTitre: null,
      libelleSource: engagementLabel,
      cibles: ['parc', 'ecoles'].map((key) => ({
        key,
        identifiantReferentiel: null,
        unite: null,
        periodicite: null,
        validation: 'pending',
        uniteImport: 'bâtiments',
        reglesImport: {
          annee: 2040,
          minimum: 0,
          maximum: null,
          plafondCible: key === 'ecoles' ? 'parc' : null,
          libelles: key === 'parc' ? ['ensemble', 'parc'] : ['école', 'écoles'],
          unites: ['bâtiment'],
        },
      })),
    },
  ],
};
const document = (label: string, value: string) =>
  buildDocument('docx', [], [], undefined, [
    {
      type: 'paragraph',
      text: 'A. Engagements',
      links: [],
      location: { pageIndex: 0, lineIndex: 0 },
    },
    {
      type: 'table',
      location: { pageIndex: 0, tableIndex: 0 },
      rows: [
        [
          "Axe du plan d'action",
          'Engagement du programme',
          'Engagement retenu',
          "Valeur chiffrée de l'engagement",
        ],
        ['Axe 13. Rénovation', label, 'Oui', value],
      ].map((row, index) =>
        row.map((text, col) => ({
          text,
          links: [],
          location: {
            pageIndex: 0,
            tableIndex: 0,
            row: index + 1,
            col: col + 1,
          },
        }))
      ),
    },
  ]);
const model = (...responses: unknown[]) => {
  const fake = new FakeLlmRepository();
  const calls = vi.spyOn(fake, 'complete');
  for (const response of responses)
    calls.mockResolvedValueOnce(
      success({
        completed: true,
        text: JSON.stringify(response),
        usage: emptyTokenUsage(),
      })
    );
  return { llm: new LlmService(fake), calls };
};

describe('Extraction fondée sur les définitions publiées', () => {
  it('relit un checkpoint V1 sans citations de rapprochement ni nouvel appel IA', () => {
    const checkpoint = electrificationExtractionCheckpointSchema.parse({
      profile: AiPlanImportProfileEnum.ELECTRIFICATION,
      schemaVersion: 1,
      catalogueVersion: 'publication-v1',
      documentKind: 'docx',
      templateVersion: 'electrification-v4',
      response: {
        engagements: [
          {
            code: 'E09',
            source: 'engagement',
            cibles: [
              {
                key: 'principale',
                valeur: 40,
                unite: 'Nombre',
                annee: 2030,
                source: 'valeur',
              },
            ],
          },
        ],
        axes: [],
        fiches: [],
      },
      sources: [
        {
          id: 'engagement',
          section: 'A',
          text: 'Accompagner les artisans',
          location: 'Engagement',
          links: [],
        },
        {
          id: 'valeur',
          section: 'A',
          text: '40 artisans',
          location: 'Valeur',
          links: [],
        },
      ],
      interpretations: [],
      tokens: emptyTokenUsage(),
    });
    expect(
      ElectrificationImportContractRules.parseCheckpoint(checkpoint, {
        profile: checkpoint.profile,
        schemaVersion: 1,
        catalogueVersion: checkpoint.catalogueVersion,
        templateVersion: checkpoint.templateVersion,
      })
    ).toEqual(success(checkpoint));
    expect(
      electrificationExtractionCheckpointSchema.safeParse({
        ...checkpoint,
        engagementInterpretations: [],
      }).success
    ).toBe(false);
    expect(
      ElectrificationExtractionRules.adapt(
        checkpoint.response,
        checkpoint.sources
      )
    ).toMatchObject({
      success: true,
      data: {
        engagements: [
          {
            code: 'E09',
            cibles: [{ valeur: 40, unite: 'Nombre', annee: 2030 }],
          },
        ],
      },
    });
  });

  it("préserve l'unité accolée au résultat même sans unité attendue", () => {
    const text = 'Le résultat atteint 42 MWh en 2025, avant conversion en kWh';
    const request = {
      kind: 'observation' as const,
      keys: ['valeur'] as ['valeur'],
      label: 'Énergie économisée',
      unit: null,
      year: null,
      source: {
        id: 'resultat',
        section: 'B' as const,
        text,
        location: 'Résultat',
        links: [],
      },
    };
    const value = {
      key: 'valeur',
      number: '42',
      unit: 'MWh',
      year: '2025',
      quote: text,
    };
    expect(
      ElectrificationValueInterpretationRules.normalize(request, [value])
    ).toBe('42 MWh (2025)');
    expect(
      ElectrificationValueInterpretationRules.normalize(request, [
        { ...value, unit: 'kWh' },
      ])
    ).toBeNull();
  });

  it('lit de nouveaux codes, clés, unités et années sans IA pour une cellule simple', async () => {
    const { llm, calls } = model();
    const result = await InterpretElectrificationValues.run({
      catalogue,
      llm,
      document: document(engagementLabel, '8 bâtiments dont 2 écoles en 2040'),
    });
    expect(result).toMatchObject({
      success: true,
      data: {
        schemaVersion: 2,
        response: {
          engagements: [
            {
              code: 'RENOVATION',
              cibles: [
                { key: 'parc', valeur: 8, unite: 'bâtiments', annee: 2040 },
                { key: 'ecoles', valeur: 2, unite: 'bâtiments', annee: 2040 },
              ],
            },
          ],
        },
      },
    });
    expect(calls).not.toHaveBeenCalled();
  });

  it('garde le format V1 pour un job admis avant le déploiement, sans nouveau rapprochement IA', async () => {
    const { llm, calls } = model();
    const result = await InterpretElectrificationValues.run({
      catalogue,
      llm,
      schemaVersion: 1,
      document: document(engagementLabel, '8 bâtiments dont 2 écoles'),
    });
    assert(result.success);
    expect(result.data.schemaVersion).toBe(1);
    expect(result.data).not.toHaveProperty('engagementInterpretations');
    expect(
      ElectrificationImportContractRules.parseCheckpoint(result.data, {
        profile: result.data.profile,
        schemaVersion: 1,
        catalogueVersion: result.data.catalogueVersion,
        templateVersion: result.data.templateVersion,
      })
    ).toEqual(success(result.data));
    const unmatched = await InterpretElectrificationValues.run({
      catalogue,
      llm,
      schemaVersion: 1,
      document: document('Une formulation inconnue', ''),
    });
    expect(unmatched.success).toBe(false);
    expect(calls).not.toHaveBeenCalled();
  });

  it('distingue les mêmes libellés dans deux axes sans appeler le modèle', async () => {
    const definitions = structuredClone(catalogue);
    definitions.axes.push({ numero: 14, titre: 'Autre axe' });
    definitions.engagements.push({
      ...definitions.engagements[0],
      code: 'AUTRE',
      axeNumero: 14,
    });
    const { llm, calls } = model();
    const result = await InterpretElectrificationValues.run({
      catalogue: definitions,
      llm,
      document: document(engagementLabel, '8 bâtiments dont 2 écoles'),
    });
    assert(result.success);
    expect(result.data.response.engagements.map(({ code }) => code)).toEqual([
      'RENOVATION',
    ]);
    expect(calls).not.toHaveBeenCalled();
  });

  it('conserve le rapprochement et les valeurs justifiées pour reprendre sans nouvel appel au modèle', async () => {
    const label = 'Nous rénoverons nos bâtiments, écoles comprises.';
    const { llm, calls } = model(
      { code: 'RENOVATION', quote: label },
      {
        values: [
          {
            key: 'ecoles',
            number: '2',
            unit: null,
            year: null,
            quote: '2 écoles',
          },
          {
            key: 'parc',
            number: '8',
            unit: null,
            year: null,
            quote: 'un ensemble de 8 bâtiments',
          },
        ],
      }
    );
    const result = await InterpretElectrificationValues.run({
      catalogue,
      llm,
      document: document(label, '2 écoles sur un ensemble de 8 bâtiments'),
    });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(JSON.stringify(result.error));
    const checkpoint = electrificationExtractionCheckpointSchema.parse(
      JSON.parse(JSON.stringify(result.data))
    );
    const contract = {
      profile: checkpoint.profile,
      schemaVersion: 2,
      catalogueVersion: checkpoint.catalogueVersion,
      templateVersion: checkpoint.templateVersion,
    };
    expect(
      ElectrificationImportContractRules.parseCheckpoint(checkpoint, contract)
    ).toEqual(success(checkpoint));
    expect(
      ElectrificationImportContractRules.parseCheckpoint(checkpoint, {
        ...contract,
        schemaVersion: 1,
      }).success
    ).toBe(false);
    expect(
      electrificationExtractionCheckpointSchema.safeParse({
        ...checkpoint,
        engagementInterpretations: undefined,
      }).success
    ).toBe(false);
    expect(checkpoint.engagementInterpretations).toEqual([
      { sourceId: 't0:r2:c2', code: 'RENOVATION', quote: label },
    ]);
    expect(
      ElectrificationExtractionRules.adapt(
        checkpoint.response,
        checkpoint.sources
      )
    ).toMatchObject({
      success: true,
      data: {
        engagements: [
          {
            code: 'RENOVATION',
            cibles: [
              { key: 'parc', valeur: 8 },
              { key: 'ecoles', valeur: 2 },
            ],
          },
        ],
      },
    });
    expect(calls).toHaveBeenCalledTimes(2);
    const prompt = JSON.parse(calls.mock.calls[0][0].prompt);
    expect(prompt.candidates).toEqual([
      { code: 'RENOVATION', label: catalogue.engagements[0].libelleSource },
    ]);
    const interpretation = checkpoint.engagementInterpretations?.[0];
    assert(interpretation);
    interpretation.quote = 'citation inventée';
    expect(
      electrificationExtractionCheckpointSchema.safeParse(checkpoint).success
    ).toBe(false);
  });

  it.each([
    { code: 'INVENTE', quote: 'Une autre formulation.' },
    { code: 'RENOVATION', quote: 'citation inventée' },
    { code: null, quote: 'Une autre formulation.' },
  ])(
    'refuse une sélection non justifiée du modèle : $code / $quote',
    async (response) => {
      const { llm } = model(response);
      const result = await InterpretElectrificationValues.run({
        catalogue,
        llm,
        document: document('Une autre formulation.', ''),
      });
      expect(result).toMatchObject({
        success: false,
        error: [{ code: 'INVALID_ELECTRIFICATION_ENGAGEMENT' }],
      });
    }
  );

  it('refuse un nombre inventé même avec une clé de cible valide', async () => {
    const { llm } = model({
      values: [
        {
          key: 'ecoles',
          number: '3',
          unit: null,
          year: null,
          quote: '2 écoles',
        },
        {
          key: 'parc',
          number: '8',
          unit: null,
          year: null,
          quote: 'un ensemble de 8 bâtiments',
        },
      ],
    });
    expect(
      await InterpretElectrificationValues.run({
        catalogue,
        llm,
        document: document(
          engagementLabel,
          '2 écoles sur un ensemble de 8 bâtiments'
        ),
      })
    ).toMatchObject({
      success: false,
      error: [{ code: 'INVALID_ELECTRIFICATION_VALUE_INTERPRETATION' }],
    });
  });
});
