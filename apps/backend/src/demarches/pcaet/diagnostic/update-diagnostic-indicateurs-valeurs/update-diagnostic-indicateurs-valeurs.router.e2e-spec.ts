import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { getYearFromIsoDate } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import {
  completeTestDiagnosticPcaet,
  completeTestDossierPcaet,
} from '../../demarches-pcaet.test-fixture';
import { demarchePcaetSourceMetadonneeTable } from '../../shared/models/demarche-pcaet-source-metadonnee.table';

describe('Mise à jour des valeurs du diagnostic PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshDemarche = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
    });
    return { collectiviteId: fixture.collectivite.id, caller, demarche };
  };

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

    return async () => {
      await app.close();
    };
  });

  test('Écrire une valeur met à jour le diagnostic servi', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    await completeTestDiagnosticPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });

    const diagnosticAvant = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    const cell =
      diagnosticAvant.indicateurValeurs.find(
        ({ indicateurValeur }) => indicateurValeur.resultat !== null
      ) ?? diagnosticAvant.indicateurValeurs[0];

    expect(cell).toBeDefined();

    const nextValue = 111;
    const year = getYearFromIsoDate(cell.indicateurValeur.dateValeur);

    await caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
      collectiviteId,
      demarcheId: demarche.id,
      valeurs: [
        {
          indicateurId: cell.indicateurValeur.indicateurId,
          year,
          field: 'resultat',
          value: nextValue,
        },
      ],
    });

    const diagnosticApres = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    const cellApres = diagnosticApres.indicateurValeurs.find(
      ({ indicateurValeur }) =>
        indicateurValeur.indicateurId === cell.indicateurValeur.indicateurId &&
        getYearFromIsoDate(indicateurValeur.dateValeur) === year
    );

    expect(cellApres?.indicateurValeur.resultat).toBe(nextValue);
  });

  test('La valeur écrite est liée à demarche_pcaet_source_metadonnee', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.c');

    await caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
      collectiviteId,
      demarcheId: demarche.id,
      valeurs: [
        {
          indicateurId,
          year: 2021,
          field: 'resultat',
          value: 42,
        },
      ],
    });

    const [link] = await db.db
      .select({
        metadonneeId: demarchePcaetSourceMetadonneeTable.metadonneeId,
      })
      .from(demarchePcaetSourceMetadonneeTable)
      .where(
        and(
          eq(demarchePcaetSourceMetadonneeTable.demarcheId, demarche.id),
          eq(demarchePcaetSourceMetadonneeTable.collectiviteId, collectiviteId)
        )
      );

    expect(link?.metadonneeId).toBeDefined();

    const valeurs = await db.db
      .select({
        metadonneeId: indicateurValeurTable.metadonneeId,
        resultat: indicateurValeurTable.resultat,
      })
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.indicateurId, indicateurId),
          eq(indicateurValeurTable.dateValeur, '2021-01-01')
        )
      );

    expect(valeurs).toHaveLength(1);
    expect(valeurs[0]).toMatchObject({
      metadonneeId: link.metadonneeId,
      resultat: 42,
    });
  });

  test('Deux PCAET d’une même Ct ont des métadonnées et valeurs isolées', async () => {
    const { caller, collectiviteId, demarche: premiere } =
      await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.c');

    await caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
      collectiviteId,
      demarcheId: premiere.id,
      valeurs: [
        {
          indicateurId,
          year: 2021,
          field: 'resultat',
          value: 100,
        },
      ],
    });

    // Libère le slot « en cours » pour créer un second dépôt sur la même Ct.
    await db.db
      .update(demarcheTable)
      .set({ status: DemarchePcaetStatusEnum.PUBLIE })
      .where(eq(demarcheTable.id, premiere.id));

    const seconde = await caller.demarches.pcaet.create({ collectiviteId });

    await caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
      collectiviteId,
      demarcheId: seconde.id,
      valeurs: [
        {
          indicateurId,
          year: 2021,
          field: 'resultat',
          value: 200,
        },
      ],
    });

    const links = await db.db
      .select({
        demarcheId: demarchePcaetSourceMetadonneeTable.demarcheId,
        metadonneeId: demarchePcaetSourceMetadonneeTable.metadonneeId,
      })
      .from(demarchePcaetSourceMetadonneeTable)
      .where(
        and(
          eq(demarchePcaetSourceMetadonneeTable.collectiviteId, collectiviteId)
        )
      );

    expect(links).toHaveLength(2);
    const metadonneePremiere = links.find(
      (link) => link.demarcheId === premiere.id
    )?.metadonneeId;
    const metadonneeSeconde = links.find(
      (link) => link.demarcheId === seconde.id
    )?.metadonneeId;
    expect(metadonneePremiere).toBeDefined();
    expect(metadonneeSeconde).toBeDefined();
    expect(metadonneePremiere).not.toBe(metadonneeSeconde);

    const diagnosticPremiere = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: premiere.id,
    });
    const diagnosticSeconde = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: seconde.id,
    });

    const cellPremiere = diagnosticPremiere.indicateurValeurs.find(
      ({ indicateurValeur }) =>
        indicateurValeur.indicateurId === indicateurId &&
        getYearFromIsoDate(indicateurValeur.dateValeur) === 2021
    );
    const cellSeconde = diagnosticSeconde.indicateurValeurs.find(
      ({ indicateurValeur }) =>
        indicateurValeur.indicateurId === indicateurId &&
        getYearFromIsoDate(indicateurValeur.dateValeur) === 2021
    );

    expect(cellPremiere?.indicateurValeur).toMatchObject({
      resultat: 100,
      metadonneeId: metadonneePremiere,
    });
    expect(cellSeconde?.indicateurValeur).toMatchObject({
      resultat: 200,
      metadonneeId: metadonneeSeconde,
    });
  });

  test("Refus quand le diagnostic n'est plus modifiable", async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    await completeTestDossierPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId,
      demarcheId: demarche.id,
    });

    await expect(
      caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
        collectiviteId,
        demarcheId: demarche.id,
        valeurs: [
          {
            indicateurId: 1,
            year: 2021,
            field: 'resultat',
            value: 111,
          },
        ],
      })
    ).rejects.toThrow("n'est modifiable que pendant l'élaboration");
  });

  test("IDOR : la mutation n'est pas applicable via une autre collectivité", async () => {
    const { collectiviteId, demarche } = await freshDemarche();
    const autre = await freshDemarche();

    await completeTestDiagnosticPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });

    await expect(
      autre.caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
        collectiviteId: autre.collectiviteId,
        demarcheId: demarche.id,
        valeurs: [
          {
            indicateurId: 1,
            year: 2021,
            field: 'resultat',
            value: 111,
          },
        ],
      })
    ).rejects.toThrow("démarche PCAET demandée n'a pas été trouvée");
  });
});
