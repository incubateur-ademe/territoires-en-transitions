import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { annexeTable } from '@tet/backend/collectivites/documents/models/annexe.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { axeIndicateurTable } from '@tet/backend/plans/fiches/shared/models/axe-indicateur.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { ELECTRIFICATION_LAUREATS_CONFIG } from '@tet/backend/plans/plans/electrification/config/electrification-eligibility.constants';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { emptyTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ELECTRIFICATION_SOURCE_ID } from '@tet/domain/indicateurs';
import {
  ELECTRIFICATION_PLAN_TYPE_KEY,
  ElectrificationConfig,
  electrificationConfig,
  ElectrificationEngagementCodeEnum as EngagementCode,
  ElectrificationLaureatsConfig,
  PlanReferenceProgrammeEnum,
  StatutEnum,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray, or } from 'drizzle-orm';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { GenerateImportDraftWorker } from '../../generate-import-draft/generate-import-draft.worker';
import { AiPlanImportProfileEnum } from '../../models/import-profile';
import { ELECTRIFICATION_CONFIG } from '@tet/backend/plans/plans/electrification/config/electrification.constants';
import { electrificationDocumentTemplate } from '@tet/backend/plans/plans/electrification/config/electrification-document-template.constants';
import {
  ELECTRIFICATION_CHECKPOINT_VERSION,
  ElectrificationExtractionCheckpoint,
} from '../extract-plan/electrification-extraction-checkpoint.schema';
import { ElectrificationExtractionResponse } from '../extract-plan/electrification-extraction.schema';
import { PrepareElectrificationImportService } from '../extract-plan/prepare-electrification-import.service';
import { PersistElectrificationImportService } from './persist-electrification-import.service';

const selectedCodes = [
  EngagementCode.SORTIE_FIOUL_LOGEMENTS_PRIVES,
  EngagementCode.SORTIE_GAZ_LOGEMENTS_PRIVES,
  EngagementCode.DECOMMISSIONNEMENT_RESEAU_GAZ,
  EngagementCode.ELECTRIFICATION_ARTISANS,
  EngagementCode.SITE_RECHARGE_POIDS_LOURDS,
];
const ficheFields = (
  titre: string | null = null
): ElectrificationExtractionResponse['fiches'][number]['champs'] => ({
  titre,
  description: null,
  objectifs: null,
  ressources: null,
  structures: null,
  partenaires: null,
  dateDebut: null,
  dateFin: null,
  statut: null,
});

describe('Persistance atomique du plan Électrification', () => {
  const llm = new FakeLlmRepository();
  const catalogue = structuredClone(electrificationConfig);
  const laureats: ElectrificationLaureatsConfig = {
    source: 'Liste synthétique complète pour les e2e',
    version: 'test-laureats',
    validFrom: '2000-01-01T00:00:00.000Z',
    validUntil: '2100-01-01T00:00:00.000Z',
    laureats: [],
  };
  let app: INestApplication;
  let db: DatabaseService;
  let service: PersistElectrificationImportService;
  let typeId: number;
  let context: Awaited<ReturnType<typeof createFixture>>;
  let checkpoint: ElectrificationExtractionCheckpoint;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder.overrideProvider(LlmService).useValue(new LlmService(llm));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
        builder.overrideProvider(ELECTRIFICATION_CONFIG).useValue(catalogue);
        builder
          .overrideProvider(ELECTRIFICATION_LAUREATS_CONFIG)
          .useValue(laureats);
      },
    });
    db = await getTestDatabase(app);
    service = app.get(PersistElectrificationImportService);
    const [type] = await db.db
      .select()
      .from(planActionTypeTable)
      .where(
        and(
          eq(
            planActionTypeTable.categorie,
            ELECTRIFICATION_PLAN_TYPE_KEY.categorie
          ),
          eq(planActionTypeTable.type, ELECTRIFICATION_PLAN_TYPE_KEY.type)
        )
      );
    assert(type, 'La migration doit créer le type Plan Électrification');
    typeId = type.id;
  });

  async function createFixture() {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const config: ElectrificationConfig = structuredClone(
      electrificationConfig
    );
    const definitions = [];
    for (const engagement of config.engagements.filter(({ code }) =>
      selectedCodes.includes(code as (typeof selectedCodes)[number])
    )) {
      for (const cible of engagement.cibles) {
        cible.identifiantReferentiel = `persist-test-${randomUUID()}`;
        cible.periodicite = 'annuelle';
        cible.validation = 'validated';
        const [definition] = await db.db
          .insert(indicateurDefinitionTable)
          .values({
            identifiantReferentiel: cible.identifiantReferentiel,
            titre: `Indicateur synthétique ${engagement.code}`,
            unite: cible.unite,
            periodicite: 'annuelle',
          })
          .returning();
        definitions.push(definition);
      }
    }
    const [catalogueIndicateur] = await db.db
      .insert(indicateurDefinitionTable)
      .values({
        identifiantReferentiel: `persist-fiche-${randomUUID()}`,
        titre: 'Énergie du catalogue',
        unite: 'MWh',
        periodicite: 'annuelle',
      })
      .returning();
    assert(catalogueIndicateur.identifiantReferentiel);
    definitions.push(catalogueIndicateur);
    config.sousAxes = [];
    config.fiches = {
      actions: [
        {
          code: 'action-test',
          validation: 'validated',
          axeNumero: 1,
          sousAxeNumero: null,
          champs: {
            titre: 'Action catalogue',
            description: 'Description catalogue',
          },
          sousActions: [
            {
              code: 'sous-action-test',
              champs: { titre: 'Sous-action catalogue' },
            },
          ],
          indicateurCodes: [],
          aides: [
            { titre: 'Aide catalogue', url: 'https://example.org/aide' },
            { titre: 'Même aide', url: 'https://example.org/aide' },
          ],
        },
      ],
      indicateurs: [
        {
          code: 'energie-test',
          validation: 'validated',
          type: 'quantitatif',
          identifiantReferentiel: catalogueIndicateur.identifiantReferentiel,
          unite: 'MWh',
          periodicite: 'annuelle',
        },
        {
          code: 'jalon-test',
          validation: 'validated',
          type: 'booleen',
          titre: 'Jalon catalogue',
        },
      ],
    };
    Object.assign(catalogue, config);
    const collectiviteId = fixture.collectivite.id;
    laureats.laureats = [
      { reference: `laureat-${collectiviteId}`, collectiviteId },
    ];
    return {
      ...fixture,
      collectiviteId,
      user: getAuthUserFromUserCredentials(fixture.user),
      definitions,
      catalogueIndicateur,
    };
  }

  function createCheckpoint(): ElectrificationExtractionCheckpoint {
    const sources: ElectrificationExtractionCheckpoint['sources'] = [];
    const source = (id: string, text: string, section: 'A' | 'B' = 'B') => {
      sources.push({
        id,
        text,
        section,
        location: `Section ${section}, ${id}`,
        links: [],
      });
      return id;
    };
    const reference = (id: string, value: string | null) => ({
      sourceId: value === null ? null : source(id, value),
      value,
    });
    return {
      profile: AiPlanImportProfileEnum.ELECTRIFICATION,
      schemaVersion: ELECTRIFICATION_CHECKPOINT_VERSION,
      catalogueVersion: catalogue.version,
      documentKind: 'docx',
      templateVersion: electrificationDocumentTemplate.version,
      sources,
      interpretations: [],
      tokens: emptyTokenUsage(),
      response: {
        engagements: selectedCodes.map((code, index) => {
          const definition = catalogue.engagements.find(
            (item) => item.code === code
          );
          assert(definition);
          return {
            code,
            source: source(`engagement-${code}`, 'Oui', 'A'),
            cibles: definition.cibles.map(({ key, unite }) => ({
              key,
              source: source(`cible-${code}`, index === 0 ? '0' : '60', 'A'),
              valeur:
                code === EngagementCode.ELECTRIFICATION_ARTISANS
                  ? null
                  : index === 0
                  ? 0
                  : 60,
              unite,
              annee: 2030,
            })),
          };
        }),
        axes: [
          {
            source: source('axe', 'Axe 1'),
            numero: 1,
            titre: 'Axe du document',
            sousAxes: [],
          },
        ],
        fiches: [
          {
            source: source('action', 'Action documentaire'),
            axeSourceKey: 'axe',
            reference: reference('reference-action', 'action-test'),
            champs: ficheFields('Action documentaire'),
            sousActions: [],
            indicateurs: [
              {
                type: 'quantitatif',
                source: source('energie', 'Énergie'),
                reference: reference('reference-energie', 'energie-test'),
                titre: null,
                unite: 'MWh',
                periodicite: 'annuelle',
                resultat: { valeur: 0, periode: '2025' },
                objectif: { valeur: 99, periode: '2030' },
              },
              {
                type: 'quantitatif',
                source: source('libre', 'Indicateur libre'),
                reference: reference('reference-libre', null),
                titre: 'Indicateur libre',
                unite: 'MWh',
                periodicite: 'annuelle',
                resultat: { valeur: 0, periode: '2025' },
                objectif: { valeur: 10, periode: '2030' },
              },
              {
                type: 'booleen',
                source: source('jalon', 'Oui'),
                reference: reference('reference-jalon', 'jalon-test'),
                titre: null,
                resultat: true,
                anneeResultat: 2025,
                objectif: true,
                anneeObjectif: 2030,
              },
            ],
          },
        ],
      },
    };
  }

  beforeEach(async () => {
    vi.spyOn(llm, 'complete');
    vi.spyOn(llm, 'chat');
    context = await createFixture();
    checkpoint = createCheckpoint();
  });

  afterEach(async () => {
    expect(llm.complete).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    const { collectiviteId } = context;
    const axes = db.db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(eq(axeTable.collectiviteId, collectiviteId));
    const fiches = db.db
      .select({ id: ficheActionTable.id })
      .from(ficheActionTable)
      .where(eq(ficheActionTable.collectiviteId, collectiviteId));
    const metadonnees = (
      await db.db
        .select({ id: axeTable.indicateurSourceMetadonneeId })
        .from(axeTable)
        .where(eq(axeTable.collectiviteId, collectiviteId))
    ).flatMap(({ id }) => (id === null ? [] : [id]));
    await db.db
      .delete(ficheActionAxeTable)
      .where(
        or(
          inArray(ficheActionAxeTable.ficheId, fiches),
          inArray(ficheActionAxeTable.axeId, axes)
        )
      );
    await db.db
      .delete(ficheActionIndicateurTable)
      .where(inArray(ficheActionIndicateurTable.ficheId, fiches));
    await db.db
      .delete(axeIndicateurTable)
      .where(inArray(axeIndicateurTable.axeId, axes));
    await db.db
      .delete(annexeTable)
      .where(eq(annexeTable.collectiviteId, collectiviteId));
    await db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.collectiviteId, collectiviteId));
    await db.db
      .delete(axeTable)
      .where(eq(axeTable.collectiviteId, collectiviteId));
    await db.db
      .delete(indicateurValeurTable)
      .where(eq(indicateurValeurTable.collectiviteId, collectiviteId));
    await db.db.delete(indicateurDefinitionTable).where(
      or(
        eq(indicateurDefinitionTable.collectiviteId, collectiviteId),
        inArray(
          indicateurDefinitionTable.id,
          context.definitions.map(({ id }) => id)
        )
      )
    );
    if (metadonnees.length)
      await db.db
        .delete(indicateurSourceMetadonneeTable)
        .where(inArray(indicateurSourceMetadonneeTable.id, metadonnees));
    await context.cleanup();
  });
  afterAll(async () => {
    // La source est partagée entre suites ; seules nos métadonnées sont nettoyées.
    await app?.close();
  });

  const input = () => ({
    collectiviteId: context.collectiviteId,
    nom: `Import synthétique ${context.collectiviteId}`,
    checkpoint,
  });
  const persist = () => service.persist(input(), { user: context.user });
  const prepare = () =>
    app
      .get(PrepareElectrificationImportService)
      .prepare(
        { collectiviteId: context.collectiviteId, resumeFrom: checkpoint },
        { user: context.user }
      );
  const checkpointSource = (sourceId: string) => {
    const source = checkpoint.sources.find(({ id }) => id === sourceId);
    assert(source, `Source documentaire absente : ${sourceId}`);
    return source;
  };
  const readAxes = () =>
    db.db
      .select()
      .from(axeTable)
      .where(eq(axeTable.collectiviteId, context.collectiviteId));
  const readFiches = () =>
    db.db
      .select()
      .from(ficheActionTable)
      .where(eq(ficheActionTable.collectiviteId, context.collectiviteId));
  const readValeurs = () =>
    db.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.collectiviteId, context.collectiviteId));
  const readDocuments = () =>
    db.db
      .select()
      .from(annexeTable)
      .where(eq(annexeTable.collectiviteId, context.collectiviteId));
  const readLocalIndicateurs = () =>
    db.db
      .select()
      .from(indicateurDefinitionTable)
      .where(
        eq(indicateurDefinitionTable.collectiviteId, context.collectiviteId)
      );
  const expectNoWrites = async () => {
    expect(await readAxes()).toEqual([]);
    expect(await readFiches()).toEqual([]);
    expect(await readValeurs()).toEqual([]);
    expect(await readLocalIndicateurs()).toEqual([]);
    expect(await readDocuments()).toEqual([]);
  };

  test('crée le plan complet, ses références et ses cibles sans écraser les valeurs de la collectivité', async () => {
    const fioul = context.definitions[0];
    const [ordinaryTarget, ordinaryCatalogue] = await db.db
      .insert(indicateurValeurTable)
      .values([
        {
          collectiviteId: context.collectiviteId,
          indicateurId: fioul.id,
          dateValeur: '2030-01-01',
          objectif: 88,
        },
        {
          collectiviteId: context.collectiviteId,
          indicateurId: context.catalogueIndicateur.id,
          dateValeur: '2030-01-01',
          objectif: 55,
        },
      ])
      .returning();

    const result = await persist();

    assert(result.success, JSON.stringify(result));
    const axes = await readAxes();
    const root = axes.find(({ id }) => id === result.data.planId);
    assert(root);
    expect(root).toMatchObject({
      typeId,
      referenceProgramme: PlanReferenceProgrammeEnum.ELECTRIFICATION,
      engagementsCodes: selectedCodes,
    });
    expect(root.indicateurSourceMetadonneeId).toEqual(expect.any(Number));
    assert(root.indicateurSourceMetadonneeId !== null);
    expect(
      axes
        .filter(({ parent }) => parent === root.id)
        .map(({ referenceCode }) => referenceCode)
        .sort()
    ).toEqual(['1', '4', '7', '9']);
    const fiches = await readFiches();
    expect(result.data.createdFicheIds.sort()).toEqual(
      fiches.map(({ id }) => id).sort()
    );
    expect(fiches).toHaveLength(5);
    expect(fiches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          titre: 'Action documentaire',
          description: 'Description catalogue',
          referenceKind: 'action',
          referenceCode: 'action-test',
        }),
        expect.objectContaining({
          titre: 'Sous-action catalogue',
          referenceKind: 'sous_action',
          referenceCode: 'sous-action-test',
          referenceParentCode: 'action-test',
        }),
        expect.objectContaining({
          titre: 'Jalon catalogue',
          referenceKind: 'indicateur_booleen',
          referenceCode: 'jalon-test',
          statut: StatutEnum.REALISE,
        }),
        ...[
          EngagementCode.DECOMMISSIONNEMENT_RESEAU_GAZ,
          EngagementCode.SITE_RECHARGE_POIDS_LOURDS,
        ].map((code) =>
          expect.objectContaining({
            referenceKind: 'engagement',
            referenceCode: code,
            statut: StatutEnum.A_VENIR,
          })
        ),
      ])
    );
    const parent = fiches.find(
      ({ referenceKind }) => referenceKind === 'action'
    );
    assert(parent);
    expect(await readDocuments()).toMatchObject([
      {
        ficheId: parent.id,
        collectiviteId: context.collectiviteId,
        titre: 'Aide catalogue',
        url: 'https://example.org/aide',
        fichierId: null,
        modifiedBy: context.user.id,
      },
    ]);
    expect(
      fiches.filter(({ parentId }) => parentId === parent.id)
    ).toHaveLength(2);
    const [free] = await readLocalIndicateurs();
    expect(free).toMatchObject({
      titre: 'Indicateur libre',
      unite: 'MWh',
      periodicite: 'annuelle',
    });
    const ficheLinks = await db.db
      .select()
      .from(ficheActionIndicateurTable)
      .where(eq(ficheActionIndicateurTable.ficheId, parent.id));
    expect(ficheLinks.map(({ indicateurId }) => indicateurId).sort()).toEqual(
      [context.catalogueIndicateur.id, free.id].sort()
    );
    const axeLinks = await db.db
      .select()
      .from(axeIndicateurTable)
      .where(
        inArray(
          axeIndicateurTable.axeId,
          axes.map(({ id }) => id)
        )
      );
    expect(axeLinks).toHaveLength(3);
    const emptyAxe = axes.find(({ referenceCode }) => referenceCode === '9');
    assert(emptyAxe);
    expect(axeLinks).toContainEqual(
      expect.objectContaining({
        axeId: emptyAxe.id,
        indicateurId: context.definitions[2].id,
      })
    );
    expect(
      await db.db
        .select()
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.axeId, emptyAxe.id))
    ).toEqual([]);
    const valeurs = await readValeurs();
    expect(valeurs).toEqual(
      expect.arrayContaining([
        ordinaryTarget,
        ordinaryCatalogue,
        expect.objectContaining({
          indicateurId: fioul.id,
          metadonneeId: root.indicateurSourceMetadonneeId,
          objectif: 0,
        }),
        expect.objectContaining({
          indicateurId: free.id,
          dateValeur: '2025-01-01',
          metadonneeId: null,
          resultat: 0,
        }),
        expect.objectContaining({
          indicateurId: free.id,
          dateValeur: '2030-01-01',
          metadonneeId: null,
          objectif: 10,
        }),
        expect.objectContaining({
          indicateurId: context.catalogueIndicateur.id,
          dateValeur: '2025-01-01',
          metadonneeId: null,
          resultat: 0,
        }),
      ])
    );
    expect(
      valeurs.filter(
        ({ metadonneeId }) => metadonneeId === root.indicateurSourceMetadonneeId
      )
    ).toHaveLength(2);
    expect(
      await db.db
        .select()
        .from(indicateurSourceMetadonneeTable)
        .where(
          eq(
            indicateurSourceMetadonneeTable.id,
            root.indicateurSourceMetadonneeId
          )
        )
    ).toMatchObject([{ sourceId: ELECTRIFICATION_SOURCE_ID }]);
    expect(result.data.report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'EMPTY_ENGAGEMENT_TARGET' }),
        expect.objectContaining({
          code: 'EXISTING_INDICATEUR_VALUE_PRESERVED',
          kind: 'preserved-data',
        }),
      ])
    );
  });

  test('lie les URL existantes sans modifier les fiches, leurs enfants ou les indicateurs', async () => {
    checkpoint.response.engagements = [];
    const [existing] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: context.collectiviteId,
        titre: 'Titre conservé',
        description: 'Description conservée',
        statut: StatutEnum.EN_COURS,
      })
      .returning();
    await db.db.insert(ficheActionTable).values({
      collectiviteId: context.collectiviteId,
      parentId: existing.id,
      titre: 'Enfant conservé',
    });
    const [existingDocument] = await db.db
      .insert(annexeTable)
      .values({
        collectiviteId: context.collectiviteId,
        ficheId: existing.id,
        titre: 'Document conservé',
        url: 'https://example.org/document-existant',
        commentaire: 'Commentaire conservé',
        modifiedBy: context.user.id,
      })
      .returning();
    const [existingValue] = await db.db
      .insert(indicateurValeurTable)
      .values({
        collectiviteId: context.collectiviteId,
        indicateurId: context.catalogueIndicateur.id,
        dateValeur: '2030-01-01',
        objectif: 75,
      })
      .returning();
    const fiche = checkpoint.response.fiches[0];
    const second = structuredClone(fiche);
    second.source = 'action-libre';
    checkpoint.sources.push({
      id: second.source,
      section: 'B',
      text: 'Nouvelle action',
      location: 'Section B, seconde action',
      links: [],
    });
    second.champs.titre = 'Nouvelle action';
    second.reference = { sourceId: null, value: null };
    second.indicateurs = [second.indicateurs[0]];
    const indicatorUrl = `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/indicateurs/te/${context.catalogueIndicateur.identifiantReferentiel}`;
    second.indicateurs[0].reference.value = indicatorUrl;
    checkpointSource('reference-energie').text = indicatorUrl;
    const ficheUrl = `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/plans/fiches/${existing.id}`;
    fiche.reference.value = ficheUrl;
    checkpointSource('reference-action').text = ficheUrl;
    fiche.indicateurs = [];
    checkpoint.response.fiches.push(second);
    // L'ajout du document de fixture met à jour la date de sa fiche par trigger.
    const existingFichesBeforeImport = await readFiches();

    const result = await persist();

    assert(result.success, JSON.stringify(result));
    const fiches = await readFiches();
    expect(fiches).toEqual(expect.arrayContaining(existingFichesBeforeImport));
    expect(fiches).toHaveLength(3);
    expect(result.data.createdFicheIds).toHaveLength(1);
    expect(await readValeurs()).toEqual([existingValue]);
    expect(await readDocuments()).toEqual([existingDocument]);
    expect(await readLocalIndicateurs()).toEqual([]);
    expect(
      await db.db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, context.catalogueIndicateur.id))
    ).toEqual([context.catalogueIndicateur]);
    expect(
      await db.db
        .select()
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.ficheId, existing.id))
    ).toHaveLength(1);
    expect(
      await db.db
        .select()
        .from(ficheActionIndicateurTable)
        .where(
          eq(ficheActionIndicateurTable.ficheId, result.data.createdFicheIds[0])
        )
    ).toMatchObject([{ indicateurId: context.catalogueIndicateur.id }]);
  });

  test('annule tous les objets si la transaction appelante échoue après la persistance', async () => {
    const [existing] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: context.collectiviteId,
        titre: 'Fiche existante préservée',
      })
      .returning();
    const reference = `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/plans/fiches/${existing.id}`;
    checkpoint.sources.push({
      id: 'existing-action',
      section: 'B',
      text: reference,
      location: 'Section B, action existante',
      links: [],
    });
    checkpoint.response.fiches.push({
      source: 'existing-action',
      axeSourceKey: 'axe',
      reference: { sourceId: 'existing-action', value: reference },
      champs: ficheFields(),
      sousActions: [],
      indicateurs: [],
    });
    let metadataId: number | null = null;
    const result = await app
      .get(TransactionManager)
      .executeSingle(async (tx) => {
        const imported = await service.persist(input(), {
          user: context.user,
          tx,
        });
        assert(imported.success, JSON.stringify(imported));
        const [root] = await tx
          .select()
          .from(axeTable)
          .where(eq(axeTable.id, imported.data.planId));
        metadataId = root.indicateurSourceMetadonneeId;
        expect(
          await tx
            .select()
            .from(ficheActionAxeTable)
            .where(eq(ficheActionAxeTable.ficheId, existing.id))
        ).toHaveLength(1);
        return failure('MARK_DONE_FAILED');
      });
    expect(result).toEqual({ success: false, error: 'MARK_DONE_FAILED' });
    expect(metadataId).toEqual(expect.any(Number));
    assert(metadataId !== null);
    expect(await readAxes()).toEqual([]);
    expect(await readFiches()).toEqual([existing]);
    expect(await readDocuments()).toEqual([]);
    expect(await readValeurs()).toEqual([]);
    expect(await readLocalIndicateurs()).toEqual([]);
    expect(
      await db.db
        .select()
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.ficheId, existing.id))
    ).toEqual([]);
    expect(
      await db.db
        .select()
        .from(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadataId))
    ).toEqual([]);
  });

  test('refuse une référence inconnue avant de créer le plan', async () => {
    checkpoint.response.fiches[0].reference.value = 'action-inconnue';
    checkpointSource('reference-action').text = 'action-inconnue';
    const result = await persist();
    assert(!result.success);
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'UNKNOWN_FICHE_REFERENCE' })
    );
    await expectNoWrites();
  });

  test('revérifie les droits après la préparation documentaire', async () => {
    const prepared = await prepare();
    assert(prepared.success, JSON.stringify(prepared));
    await db.db
      .update(utilisateurCollectiviteAccessTable)
      .set({ role: CollectiviteRole.LECTURE })
      .where(
        and(
          eq(
            utilisateurCollectiviteAccessTable.collectiviteId,
            context.collectiviteId
          ),
          eq(utilisateurCollectiviteAccessTable.userId, context.user.id)
        )
      );
    const result = await persist();
    assert(!result.success);
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'UNAUTHORIZED' })
    );
    await expectNoWrites();
  });

  test.each([
    { unite: 'kWh' },
    { identifiantReferentiel: `reference-modifiee-${randomUUID()}` },
  ])(
    'refuse une définition modifiée entre préparation et écriture : %j',
    async (change) => {
      const preparation = app.get(PrepareElectrificationImportService);
      const original = preparation.prepare.bind(preparation);
      vi.spyOn(preparation, 'prepare').mockImplementationOnce(
        async (...args) => {
          const prepared = await original(...args);
          assert(prepared.success, JSON.stringify(prepared));
          await db.db
            .update(indicateurDefinitionTable)
            .set(change)
            .where(
              eq(indicateurDefinitionTable.id, context.catalogueIndicateur.id)
            );
          return prepared;
        }
      );
      const result = await persist();
      assert(!result.success);
      expect(result.error).toContainEqual(
        expect.objectContaining({ code: 'ELECTRIFICATION_REFERENCES_CHANGED' })
      );
      await expectNoWrites();
    }
  );

  test("refuse l'initialisation conventionnelle si la collectivité n'est plus lauréate", async () => {
    const preparation = app.get(PrepareElectrificationImportService);
    const original = preparation.prepare.bind(preparation);
    vi.spyOn(preparation, 'prepare').mockImplementationOnce(async (...args) => {
      const prepared = await original(...args);
      assert(prepared.success, JSON.stringify(prepared));
      laureats.laureats = [];
      return prepared;
    });
    const result = await persist();
    assert(!result.success);
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'ELECTRIFICATION_IMPORT_NOT_ALLOWED' })
    );
    await expectNoWrites();
  });
});
