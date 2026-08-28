import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import type { PcaetDiagnostic } from '@tet/domain/demarches';
import { getYearFromIsoDate } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import {
  completeTestDossierPcaet,
  ensureTestPcaetMetadonneeId,
} from '../demarches-pcaet.test-fixture';

/** Onglets du diagnostic : parents indicateurs puis vulnérabilité. */
const listDiagnosticTabCodes = (diagnostic: PcaetDiagnostic): string[] => [
  ...diagnostic.indicateurParentConfigs.map((config) => config.code),
  diagnostic.vulnerabilite.code,
];

const findValeur = (
  diagnostic: PcaetDiagnostic,
  {
    indicateurId,
    year,
  }: {
    indicateurId?: number;
    year: number;
  }
) =>
  diagnostic.indicateurValeurs.find(
    ({ indicateurValeur }) =>
      getYearFromIsoDate(indicateurValeur.dateValeur) === year &&
      (indicateurId === undefined ||
        indicateurValeur.indicateurId === indicateurId)
  );

describe('Récupérer le diagnostic PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let otherCollectivite: Collectivite;
  let otherEditorUser: AuthenticatedUser;

  /** Le diagnostic dépend des valeurs de la collectivité : une par test. */
  const freshDemarche = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
    });
    return { collectivite: fixture.collectivite, caller, demarche };
  };

  const getDiagnostic = (
    caller: Awaited<ReturnType<typeof freshDemarche>>['caller'],
    {
      collectivite,
      demarche,
    }: { collectivite: Collectivite; demarche: { id: number } }
  ) =>
    caller.demarches.pcaet.diagnostic.get({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

  const getIndicateurId = async (referentielId: string): Promise<number> => {
    const rows = await db.db
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurDefinitionTable)
      .where(
        eq(indicateurDefinitionTable.identifiantReferentiel, referentielId)
      );
    const definition = rows[0];
    if (!definition) {
      throw new Error(`Indicateur ${referentielId} absent du référentiel`);
    }
    return definition.id;
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const other = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    otherCollectivite = other.collectivite;
    otherEditorUser = getAuthUserFromUserCredentials(other.user);

    return async () => {
      await app.close();
    };
  });

  test('Renvoie les topics du diagnostic dans l’ordre d’affichage', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const diagnostic = await getDiagnostic(caller, { collectivite, demarche });

    expect(listDiagnosticTabCodes(diagnostic)).toEqual([
      'emissions_ges',
      'polluants_atmospheriques',
      'sequestration',
      'consommation_energetique',
      'enr',
      'vulnerabilite_territoire',
    ]);
  });

  test('Les émissions de GES s’arrêtent aux secteurs du décret', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const diagnostic = await getDiagnostic(caller, { collectivite, demarche });
    const emissions = diagnostic.indicateurParentConfigs.find(
      (config) => config.code === 'emissions_ges'
    );

    expect(emissions).toMatchObject({
      indicateurDefinitionId: 'cae_1.a',
      referenceYearApplyLevel: 'parent',
    });
    expect(emissions?.children.map((child) => child.indicateurDefinitionId)).toEqual([
      'cae_1.c',
      'cae_1.d',
      'cae_1.e',
      'cae_1.f',
      'cae_1.g',
      'cae_1.h',
      'cae_1.i',
      'cae_1.j',
    ]);
    expect(emissions?.children.every((child) => child.children === undefined)).toBe(
      true
    );
  });

  test('La consommation énergétique finale est un topic à part entière', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const conso = (
      await getDiagnostic(caller, { collectivite, demarche })
    ).indicateurParentConfigs.find(
      (config) => config.code === 'consommation_energetique'
    );

    expect(conso).toMatchObject({
      indicateurDefinitionId: 'cae_2.a',
    });
    expect(conso?.children).toHaveLength(8);
  });

  test('La séquestration est optionnelle', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const sequestration = (
      await getDiagnostic(caller, { collectivite, demarche })
    ).indicateurParentConfigs.find((config) => config.code === 'sequestration');

    expect(sequestration?.optional).toBe(true);
    expect(
      sequestration?.children.map((child) => child.indicateurDefinitionId)
    ).toEqual(['cae_63.b', 'cae_63.c', 'cae_63.e', 'cae_63.d']);
  });

  test('Les polluants déclinent chaque total par secteur', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const polluants = (
      await getDiagnostic(caller, { collectivite, demarche })
    ).indicateurParentConfigs.find(
      (config) => config.code === 'polluants_atmospheriques'
    );

    expect(polluants?.children.map((child) => child.indicateurDefinitionId)).toEqual([
      'cae_4.a',
      'cae_4.b',
      'cae_4.c',
      'cae_4.d',
      'cae_4.e',
      'cae_4.f',
    ]);
    expect(
      polluants?.children.flatMap((child) => child.children ?? [])
    ).toHaveLength(48);
  });

  test('Sans saisie PCAET, aucune valeur n’est remontée', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const diagnostic = await getDiagnostic(caller, { collectivite, demarche });

    expect(diagnostic.indicateurValeurs).toEqual([]);
    expect(diagnostic.indicateurDefinitions.length).toBeGreaterThan(0);
  });

  test('La saisie PCAET remplit les valeurs servies', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.c');
    const metadonneeId = await ensureTestPcaetMetadonneeId(db, {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    await db.db.insert(indicateurValeurTable).values([
      {
        collectiviteId: collectivite.id,
        indicateurId,
        dateValeur: '2021-01-01',
        metadonneeId,
        resultat: 12,
      },
      {
        collectiviteId: collectivite.id,
        indicateurId,
        dateValeur: '2030-01-01',
        metadonneeId,
        objectif: 8,
      },
    ]);

    const diagnostic = await getDiagnostic(caller, { collectivite, demarche });

    expect(
      findValeur(diagnostic, { indicateurId, year: 2021 })?.indicateurValeur
    ).toMatchObject({ resultat: 12, objectif: null });
    expect(
      findValeur(diagnostic, { indicateurId, year: 2030 })?.indicateurValeur
    ).toMatchObject({ resultat: null, objectif: 8 });
  });

  test('Le topic vulnérabilité n’a pas de grille', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const { vulnerabilite } = await getDiagnostic(caller, {
      collectivite,
      demarche,
    });

    expect(vulnerabilite).toMatchObject({
      code: 'vulnerabilite_territoire',
      label: 'Vulnérabilité du territoire',
      icon: 'map-2-line',
      horizons: [2050, 2100],
    });
    expect(vulnerabilite.thematiques.length).toBeGreaterThan(0);
    expect(vulnerabilite.lignes).toHaveLength(vulnerabilite.thematiques.length);
  });

  test('Après transmission, le diagnostic reste live', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    const transmis = await getDiagnostic(caller, { collectivite, demarche });
    expect(
      findValeur(transmis, { year: 2021 })?.indicateurValeur.resultat
    ).toBe(100);

    const metadonneeId = await ensureTestPcaetMetadonneeId(db, {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    await db.db
      .update(indicateurValeurTable)
      .set({ resultat: 999 })
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectivite.id),
          eq(indicateurValeurTable.metadonneeId, metadonneeId),
          eq(indicateurValeurTable.dateValeur, '2021-01-01')
        )
      );

    const relu = await getDiagnostic(caller, { collectivite, demarche });
    expect(findValeur(relu, { year: 2021 })?.indicateurValeur.resultat).toBe(
      999
    );
  });

  test('Les valeurs remontées sont celles de la collectivité de la démarche', async () => {
    const first = await freshDemarche();
    const second = await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.c');
    const metadonneeId = await ensureTestPcaetMetadonneeId(db, {
      collectiviteId: first.collectivite.id,
      demarcheId: first.demarche.id,
    });

    await db.db.insert(indicateurValeurTable).values({
      collectiviteId: first.collectivite.id,
      indicateurId,
      dateValeur: '2019-01-01',
      metadonneeId,
      resultat: 99,
    });

    const diagnostic = await getDiagnostic(second.caller, {
      collectivite: second.collectivite,
      demarche: second.demarche,
    });

    expect(diagnostic.indicateurValeurs).toEqual([]);
  });

  test("IDOR : le diagnostic n'est pas lisible via une autre collectivité", async () => {
    const { demarche } = await freshDemarche();

    const otherCaller = router.createCaller({ user: otherEditorUser });
    await expect(
      otherCaller.demarches.pcaet.diagnostic.get({
        collectiviteId: otherCollectivite.id,
        demarcheId: demarche.id,
      })
    ).rejects.toThrow("La démarche PCAET demandée n'a pas été trouvée");
  });
});
