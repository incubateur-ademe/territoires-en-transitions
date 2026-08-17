import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
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
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';

const CURRENT_YEAR = new Date().getFullYear();

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
    { collectivite, demarche }: { collectivite: Collectivite; demarche: { id: number } }
  ) =>
    caller.demarches.pcaet.diagnostic.get({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

  const getIndicateurId = async (referentielId: string): Promise<number> => {
    const rows = await db.db
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.identifiantReferentiel, referentielId));
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

    expect(diagnostic.topics.map((topic) => topic.code)).toEqual([
      'profil_energie_climat',
      'polluants_atmospheriques',
      'sequestration',
      'consommation_energetique',
      'enr',
      'vulnerabilite_territoire',
    ]);
    expect(diagnostic.snapshotDate).toBeNull();
  });

  test('Les émissions de GES s’arrêtent aux secteurs du décret', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const diagnostic = await getDiagnostic(caller, { collectivite, demarche });
    const profil = diagnostic.topics.find(
      (topic) => topic.code === 'profil_energie_climat'
    );

    expect(profil).toMatchObject({
      groupLabel: 'Secteur',
      rowLabel: null,
      unit: 'kteq CO2',
      referentielId: 'cae_1.a',
    });
    expect(profil?.rows.map((row) => row.referentielId)).toEqual([
      'cae_1.c',
      'cae_1.d',
      'cae_1.e',
      'cae_1.f',
      'cae_1.g',
      'cae_1.h',
      'cae_1.i',
      'cae_1.j',
    ]);
    // Topic à un seul niveau : aucune ligne ne se décompose.
    expect(profil?.rows.every((row) => row.rows.length === 0)).toBe(true);
    // Toutes les lignes sont saisissables : aucune ne dépend d'un groupement.
    expect(profil?.rows.every((row) => row.indicateurId !== null)).toBe(true);
  });

  test('La consommation énergétique finale est un topic à part entière', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const conso = (await getDiagnostic(caller, { collectivite, demarche })).topics.find(
      (topic) => topic.code === 'consommation_energetique'
    );

    expect(conso).toMatchObject({ unit: 'GWh', referentielId: 'cae_2.a' });
    expect(conso?.rows).toHaveLength(8);
  });

  test('La séquestration ne rend obligatoires que la forêt et les terres agricoles', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const sequestration = (
      await getDiagnostic(caller, { collectivite, demarche })
    ).topics.find((topic) => topic.code === 'sequestration');

    expect(
      sequestration?.rows.filter((row) => row.requis).map((row) => row.referentielId)
    ).toEqual(['cae_63.b', 'cae_63.c']);
  });

  test('Les polluants déclinent chaque total par secteur', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const polluants = (
      await getDiagnostic(caller, { collectivite, demarche })
    ).topics.find((topic) => topic.code === 'polluants_atmospheriques');

    expect(polluants).toMatchObject({ groupLabel: 'Polluant', rowLabel: 'Secteur' });
    expect(polluants?.rows.map((row) => row.referentielId)).toEqual([
      'cae_4.a',
      'cae_4.b',
      'cae_4.c',
      'cae_4.d',
      'cae_4.e',
      'cae_4.f',
    ]);
    expect(polluants?.rows.flatMap((row) => row.rows)).toHaveLength(54);
  });

  test('Sans valeur, l’année de comptabilisation proposée est l’année courante', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const profil = (await getDiagnostic(caller, { collectivite, demarche })).topics.find(
      (topic) => topic.code === 'profil_energie_climat'
    );

    expect(profil?.referenceYear).toBe(CURRENT_YEAR);
    expect(profil?.years).toEqual(
      [CURRENT_YEAR, 2030, 2036, 2050].filter(
        (year, index, years) => years.indexOf(year) === index
      )
    );
    expect(profil?.valeurs.every((valeur) => valeur.resultat === null)).toBe(true);
  });

  test('La saisie de la collectivité fixe l’année proposée et remplit sa cellule', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.c');

    await db.db.insert(indicateurValeurTable).values([
      { collectiviteId: collectivite.id, indicateurId, dateValeur: '2021-01-01', resultat: 12 },
      { collectiviteId: collectivite.id, indicateurId, dateValeur: '2030-01-01', objectif: 8 },
    ]);

    const profil = (await getDiagnostic(caller, { collectivite, demarche })).topics.find(
      (topic) => topic.code === 'profil_energie_climat'
    );

    expect(profil?.referenceYear).toBe(2021);
    expect(profil?.years).toEqual([2021, 2030, 2036, 2050]);
    expect(
      profil?.valeurs.find(
        (valeur) => valeur.indicateurId === indicateurId && valeur.year === 2021
      )
    ).toMatchObject({ resultat: 12, objectif: null, references: [] });
    expect(
      profil?.valeurs.find(
        (valeur) => valeur.indicateurId === indicateurId && valeur.year === 2030
      )
    ).toMatchObject({ resultat: null, objectif: 8 });
  });

  test('Une valeur open data arrive en référence, sans se substituer à la saisie', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.d');
    const [metadonnee] = await db.db
      .select({ id: indicateurSourceMetadonneeTable.id })
      .from(indicateurSourceMetadonneeTable)
      .where(eq(indicateurSourceMetadonneeTable.sourceId, 'rare'))
      .limit(1);

    await db.db.insert(indicateurValeurTable).values({
      collectiviteId: collectivite.id,
      indicateurId,
      dateValeur: `${CURRENT_YEAR}-01-01`,
      metadonneeId: metadonnee.id,
      resultat: 42,
    });

    const profil = (await getDiagnostic(caller, { collectivite, demarche })).topics.find(
      (topic) => topic.code === 'profil_energie_climat'
    );
    const cellule = profil?.valeurs.find(
      (valeur) => valeur.indicateurId === indicateurId && valeur.year === CURRENT_YEAR
    );

    expect(cellule?.resultat).toBeNull();
    expect(cellule?.references).toEqual([
      expect.objectContaining({ sourceId: 'rare', resultat: 42 }),
    ]);
  });

  test('Le topic vulnérabilité n’a pas de grille', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const vulnerabilite = (
      await getDiagnostic(caller, { collectivite, demarche })
    ).topics.find((topic) => topic.code === 'vulnerabilite_territoire');

    expect(vulnerabilite).toMatchObject({
      kind: 'vulnerabilite',
      groupLabel: null,
      unit: null,
      referenceYear: null,
    });
    expect(vulnerabilite?.rows).toEqual([]);
    expect(vulnerabilite?.years).toEqual([]);
  });

  test('Dès la transmission, l’écran montre la photo du dossier déposé', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    await caller.demarches.pcaet.applyTransition({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      transition: 'transmettre_pour_avis',
    });

    const transmis = await getDiagnostic(caller, { collectivite, demarche });
    expect(transmis.snapshotDate).not.toBeNull();

    const profilTransmis = transmis.topics.find(
      (topic) => topic.code === 'profil_energie_climat'
    );
    const resultat = profilTransmis?.valeurs.find(
      (valeur) => valeur.year === 2021 && valeur.resultat !== null
    );
    expect(resultat?.resultat).toBe(100);

    // La collectivité continue de piloter ses indicateurs : la photo ne bouge pas.
    await db.db
      .update(indicateurValeurTable)
      .set({ resultat: 999 })
      .where(eq(indicateurValeurTable.collectiviteId, collectivite.id));

    const relu = await getDiagnostic(caller, { collectivite, demarche });
    expect(
      relu.topics
        .find((topic) => topic.code === 'profil_energie_climat')
        ?.valeurs.find((valeur) => valeur.year === 2021 && valeur.resultat !== null)
        ?.resultat
    ).toBe(100);
  });

  test('Les valeurs remontées sont celles de la collectivité de la démarche', async () => {
    const first = await freshDemarche();
    const second = await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.c');

    await db.db.insert(indicateurValeurTable).values({
      collectiviteId: first.collectivite.id,
      indicateurId,
      dateValeur: '2019-01-01',
      resultat: 99,
    });

    const profil = (
      await getDiagnostic(second.caller, {
        collectivite: second.collectivite,
        demarche: second.demarche,
      })
    ).topics.find((topic) => topic.code === 'profil_energie_climat');

    expect(profil?.referenceYear).toBe(CURRENT_YEAR);
    expect(profil?.valeurs.every((valeur) => valeur.resultat === null)).toBe(true);
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
