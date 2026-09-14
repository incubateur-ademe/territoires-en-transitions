import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { seedTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { DocumentCollectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';

const getLienTitre = (document: DocumentCollectivite): string | undefined =>
  document.type === 'lien' ? document.lien.titre : undefined;

const getFichierFilename = (
  document: DocumentCollectivite
): string | undefined =>
  document.type === 'fichier' ? document.fichier.filename : undefined;

type DocumentProjete =
  | { type: 'fichier'; filename: string }
  | { type: 'lien'; titre: string }
  | { type: 'fichierManquant'; filename: string }
  | { type: 'nonRenseigne' };

const toDocumentProjete = (document: DocumentCollectivite): DocumentProjete => {
  switch (document.type) {
    case 'fichier':
      return { type: 'fichier', filename: document.fichier.filename };
    case 'lien':
      return { type: 'lien', titre: document.lien.titre };
    case 'fichierManquant':
      return { type: 'fichierManquant', filename: document.filename };
    case 'nonRenseigne':
      return { type: 'nonRenseigne' };
  }
};

const getAttendusProjetes = ({
  attendus,
}: {
  attendus: { documents: DocumentCollectivite[] }[];
}): DocumentProjete[] =>
  attendus.flatMap(({ documents }) => documents.map(toDocumentProjete));

const getAttendusIds = ({
  attendus,
}: {
  attendus: { preuveReglementaire: { id: string } }[];
}): string[] =>
  attendus.map(({ preuveReglementaire }) => preuveReglementaire.id);

const MESURE = {
  actionId: 'eci_1.1.4',
  attendus: ['delib_strategie_eci', 'plan_action_eci'],
  sousMesure: 'eci_1.1.4.1',
  siblingSousMesure: 'eci_1.1.4.10',
} as const;

describe('List Mesure Documents Router', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let app: INestApplication;
  let visiteurUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const visiteurResult = await addTestUser(db);
    visiteurUser = getAuthUserFromUserCredentials(visiteurResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const createCollectivite = async ({
    accesRestreint = false,
  }: { accesRestreint?: boolean } = {}) => {
    const { collectivite, users, cleanup } = await addTestCollectiviteAndUsers(
      db,
      {
        collectivite: { accesRestreint },
        users: [{ role: CollectiviteRole.EDITION }],
      }
    );
    onTestFinished(cleanup);

    const membre = users[0];
    const collectiviteId = collectivite.id;

    const [bucket] = await db.db
      .select({ bucketId: collectiviteBucketTable.bucketId })
      .from(collectiviteBucketTable)
      .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId));

    const addFichier = async (document: {
      filename: string;
      confidentiel?: boolean;
      withStorageObject?: boolean;
    }) => {
      const fichier = await seedTestDocument({
        databaseService: db,
        collectiviteId,
        filename: document.filename,
        confidentiel: document.confidentiel,
        withStorageObject: document.withStorageObject,
      });
      onTestFinished(async () => {
        await db.db
          .delete(bibliothequeFichierTable)
          .where(eq(bibliothequeFichierTable.id, fichier.id));
      });
      return fichier;
    };

    return {
      collectiviteId,
      bucketId: bucket.bucketId,
      membreCaller: router.createCaller({
        user: getAuthUserFromUserCredentials(membre),
      }),

      async addAttenduDepot({
        preuveId,
        titre,
        fichierId,
      }: {
        preuveId: string;
        titre: string;
        fichierId?: number;
      }) {
        const [depot] = await db.db
          .insert(preuveReglementaireTable)
          .values({
            collectiviteId,
            preuveId,
            titre,
            url: fichierId ? null : `https://example.com/${titre}`,
            fichierId: fichierId ?? null,
            commentaire: '',
            modifiedBy: membre.id,
          })
          .returning({ id: preuveReglementaireTable.id });
        onTestFinished(async () => {
          await db.db
            .delete(preuveReglementaireTable)
            .where(eq(preuveReglementaireTable.id, depot.id));
        });
      },

      async addComplementaire({
        actionId,
        titre,
        fichierId,
      }: {
        actionId: string;
        titre: string;
        fichierId?: number;
      }) {
        const [depot] = await db.db
          .insert(preuveComplementaireTable)
          .values({
            collectiviteId,
            actionId,
            titre,
            url: fichierId ? null : `https://example.com/${titre}`,
            fichierId: fichierId ?? null,
            commentaire: '',
            modifiedBy: membre.id,
          })
          .returning({ id: preuveComplementaireTable.id });
        onTestFinished(async () => {
          await db.db
            .delete(preuveComplementaireTable)
            .where(eq(preuveComplementaireTable.id, depot.id));
        });
      },

      addFichier,
    };
  };

  test("rend les deux attendus de la mesure avec une liste de documents vide quand rien n'est déposé", async () => {
    const { collectiviteId, membreCaller } = await createCollectivite();

    const { attendus } =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    expect(
      attendus.map(({ preuveReglementaire, documents }) => ({
        attendu: preuveReglementaire.id,
        nombreDeDocuments: documents.length,
      }))
    ).toEqual([
      { attendu: MESURE.attendus[0], nombreDeDocuments: 0 },
      { attendu: MESURE.attendus[1], nombreDeDocuments: 0 },
    ]);
  });

  test("regroupe les deux dépôts d'un même attendu sous ce seul attendu", async () => {
    const { collectiviteId, membreCaller, addAttenduDepot } =
      await createCollectivite();

    await addAttenduDepot({ preuveId: MESURE.attendus[0], titre: 'premier' });
    await addAttenduDepot({ preuveId: MESURE.attendus[0], titre: 'second' });

    const { attendus } =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    expect(
      attendus.map(({ preuveReglementaire, documents }) => ({
        attendu: preuveReglementaire.id,
        titres: documents.map(getLienTitre),
      }))
    ).toEqual([
      { attendu: MESURE.attendus[0], titres: ['premier', 'second'] },
      { attendu: MESURE.attendus[1], titres: [] },
    ]);
  });

  test("ne rend pas le dépôt d'une autre collectivité sur le même attendu", async () => {
    const autreCollectivite = await createCollectivite();
    await autreCollectivite.addAttenduDepot({
      preuveId: MESURE.attendus[0],
      titre: 'depot-voisin',
    });

    const { collectiviteId, membreCaller, addAttenduDepot } =
      await createCollectivite();
    await addAttenduDepot({
      preuveId: MESURE.attendus[0],
      titre: 'depot-propre',
    });

    const { attendus } =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    expect(
      attendus.flatMap(({ documents }) => documents.map(getLienTitre))
    ).toEqual(['depot-propre']);
  });

  test("laisse de côté les documents d'une sous-mesure quand withSubActions est absent", async () => {
    const { collectiviteId, membreCaller, addComplementaire } =
      await createCollectivite();

    await addComplementaire({
      actionId: MESURE.actionId,
      titre: 'sur-la-mesure',
    });
    await addComplementaire({
      actionId: MESURE.sousMesure,
      titre: 'sur-la-sous-mesure',
    });

    const { complementaires } =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    expect(complementaires.map(getLienTitre)).toEqual(['sur-la-mesure']);
  });

  test('descend dans les sous-mesures quand withSubActions est demandé', async () => {
    const { collectiviteId, membreCaller, addComplementaire } =
      await createCollectivite();

    await addComplementaire({
      actionId: MESURE.actionId,
      titre: 'sur-la-mesure',
    });
    await addComplementaire({
      actionId: MESURE.sousMesure,
      titre: 'sur-la-sous-mesure',
    });

    const { complementaires } =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
        withSubActions: true,
      });

    expect(complementaires.map(getLienTitre)).toEqual([
      'sur-la-mesure',
      'sur-la-sous-mesure',
    ]);
  });

  test('ne confond pas la sous-mesure 1.1.4.1 avec la sous-mesure 1.1.4.10', async () => {
    const { collectiviteId, membreCaller, addComplementaire } =
      await createCollectivite();

    await addComplementaire({
      actionId: MESURE.sousMesure,
      titre: 'sur-1-1-4-1',
    });
    await addComplementaire({
      actionId: MESURE.siblingSousMesure,
      titre: 'sur-1-1-4-10',
    });

    const { complementaires } =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.sousMesure,
        withSubActions: true,
      });

    expect(complementaires.map(getLienTitre)).toEqual(['sur-1-1-4-1']);
  });

  test('masque un document confidentiel à un visiteur non membre', async () => {
    const { collectiviteId, membreCaller, addAttenduDepot, addFichier } =
      await createCollectivite();

    const fichierPublic = await addFichier({ filename: 'public.pdf' });
    const fichierConfidentiel = await addFichier({
      filename: 'confidentiel.pdf',
      confidentiel: true,
    });
    await addAttenduDepot({
      preuveId: MESURE.attendus[0],
      titre: 'public',
      fichierId: fichierPublic.id,
    });
    await addAttenduDepot({
      preuveId: MESURE.attendus[0],
      titre: 'confidentiel',
      fichierId: fichierConfidentiel.id,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const visiteurView =
      await visiteurCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });
    const membreView =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    const getFilenames = ({ attendus }: typeof visiteurView) =>
      attendus.flatMap(({ documents }) => documents.map(getFichierFilename));

    expect(getFilenames(visiteurView)).toEqual(['public.pdf']);
    expect(getFilenames(membreView)).toEqual([
      'public.pdf',
      'confidentiel.pdf',
    ]);
  });

  test('montre au visiteur un attendu dont le fichier public a perdu ses octets', async () => {
    const { collectiviteId, membreCaller, addAttenduDepot, addFichier } =
      await createCollectivite();

    const purgedFichier = await addFichier({
      filename: 'sans-octets.pdf',
      withStorageObject: false,
    });
    await addAttenduDepot({
      preuveId: MESURE.attendus[0],
      titre: 'sans-octets',
      fichierId: purgedFichier.id,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const visiteurView =
      await visiteurCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });
    const membreView =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    expect(getAttendusProjetes(visiteurView)).toEqual(
      getAttendusProjetes(membreView)
    );
    expect(getAttendusProjetes(visiteurView)).toEqual([
      { type: 'fichierManquant', filename: 'sans-octets.pdf' },
    ]);
  });

  test('montre au visiteur un complémentaire dont le fichier public a perdu ses octets', async () => {
    const { collectiviteId, membreCaller, addComplementaire, addFichier } =
      await createCollectivite();

    const purgedFichier = await addFichier({
      filename: 'complementaire-sans-octets.pdf',
      withStorageObject: false,
    });
    await addComplementaire({
      actionId: MESURE.actionId,
      titre: 'complementaire-sans-octets',
      fichierId: purgedFichier.id,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const visiteurView =
      await visiteurCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });
    const membreView =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    const getComplementairesProjetes = ({
      complementaires,
    }: typeof visiteurView): DocumentProjete[] =>
      complementaires.map(toDocumentProjete);

    expect(getComplementairesProjetes(visiteurView)).toEqual(
      getComplementairesProjetes(membreView)
    );
    expect(getComplementairesProjetes(visiteurView)).toEqual([
      {
        type: 'fichierManquant',
        filename: 'complementaire-sans-octets.pdf',
      },
    ]);
  });

  test('cache au visiteur un attendu dont le fichier confidentiel a perdu ses octets', async () => {
    const { collectiviteId, membreCaller, addAttenduDepot, addFichier } =
      await createCollectivite();

    const purgedFichier = await addFichier({
      filename: 'secret-sans-octets.pdf',
      confidentiel: true,
      withStorageObject: false,
    });
    await addAttenduDepot({
      preuveId: MESURE.attendus[0],
      titre: 'secret-sans-octets',
      fichierId: purgedFichier.id,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const visiteurView =
      await visiteurCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });
    const membreView =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    expect(getAttendusProjetes(visiteurView)).toEqual([]);
    expect(getAttendusProjetes(membreView)).toEqual([
      { type: 'fichierManquant', filename: 'secret-sans-octets.pdf' },
    ]);
  });

  test('cache au visiteur un complémentaire dont le fichier confidentiel a perdu ses octets', async () => {
    const { collectiviteId, membreCaller, addComplementaire, addFichier } =
      await createCollectivite();

    const purgedFichier = await addFichier({
      filename: 'complementaire-secret-sans-octets.pdf',
      confidentiel: true,
      withStorageObject: false,
    });
    await addComplementaire({
      actionId: MESURE.actionId,
      titre: 'complementaire-secret',
      fichierId: purgedFichier.id,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const visiteurView =
      await visiteurCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });
    const membreView =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    expect(visiteurView.complementaires.map(toDocumentProjete)).toEqual([]);
    expect(membreView.complementaires.map(toDocumentProjete)).toEqual([
      {
        type: 'fichierManquant',
        filename: 'complementaire-secret-sans-octets.pdf',
      },
    ]);
  });

  test('décrit un fichier présent par son empreinte, son bucket et sa taille', async () => {
    const {
      collectiviteId,
      bucketId,
      membreCaller,
      addAttenduDepot,
      addFichier,
    } = await createCollectivite();

    const fichier = await addFichier({ filename: 'present.pdf' });
    await addAttenduDepot({
      preuveId: MESURE.attendus[0],
      titre: 'present',
      fichierId: fichier.id,
    });

    const membreView =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    expect(membreView.attendus[0].documents).toEqual([
      {
        id: expect.any(Number),
        collectiviteId,
        commentaire: '',
        modifiedAt: expect.any(String),
        modifiedBy: expect.any(String),
        modifiedByNom: expect.any(String),
        action: { actionId: MESURE.actionId, identifiant: '1.1.4' },
        preuveType: 'reglementaire',
        preuveReglementaire: {
          id: MESURE.attendus[0],
          nom: expect.any(String),
          description: expect.any(String),
        },
        type: 'fichier',
        fichier: {
          id: fichier.id,
          collectiviteId,
          hash: fichier.hash,
          filename: 'present.pdf',
          confidentiel: false,
          bucketId,
          filesize: 1024,
        },
      },
    ]);
  });

  test("écarte un dépôt pointant le fichier d'une autre collectivité, quel que soit le droit du lecteur", async () => {
    const autreCollectivite = await createCollectivite();
    const fichierVoisin = await autreCollectivite.addFichier({
      filename: 'fichier-du-voisin.pdf',
    });

    const { collectiviteId, membreCaller, addAttenduDepot } =
      await createCollectivite();
    await addAttenduDepot({
      preuveId: MESURE.attendus[0],
      titre: 'pointe-chez-le-voisin',
      fichierId: fichierVoisin.id,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const visiteurView =
      await visiteurCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });
    const membreView =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    expect(getAttendusProjetes(membreView)).toEqual([]);
    expect(getAttendusProjetes(visiteurView)).toEqual([]);
  });

  test("n'émet jamais de document sans fichier ni lien, contrairement au contrat partagé qui l'autorise", async () => {
    const { collectiviteId, membreCaller, addAttenduDepot, addFichier } =
      await createCollectivite();

    await addAttenduDepot({ preuveId: MESURE.attendus[0], titre: 'un-lien' });
    const fichier = await addFichier({ filename: 'un-fichier.pdf' });
    await addAttenduDepot({
      preuveId: MESURE.attendus[1],
      titre: 'un-fichier',
      fichierId: fichier.id,
    });

    const membreView =
      await membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      });

    const types = [
      ...membreView.attendus.flatMap(({ documents }) =>
        documents.map(({ type }) => type)
      ),
      ...membreView.complementaires.map(({ type }) => type),
    ];
    expect(types).not.toContain('nonRenseigne');
    expect(types.sort()).toEqual(['fichier', 'lien']);
  });

  test("refuse la lecture d'une collectivité en accès restreint à un utilisateur non membre", async () => {
    const { collectiviteId } = await createCollectivite({
      accesRestreint: true,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });

    await expect(
      visiteurCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: MESURE.actionId,
      })
    ).rejects.toThrow(
      "Vous n'avez pas les permissions nécessaires pour lister les documents de cette mesure."
    );
  });

  test('rejette un identifiant de mesure dont le préfixe ne désigne aucun référentiel', async () => {
    const { collectiviteId, membreCaller } = await createCollectivite();

    await expect(
      membreCaller.referentiels.documents.listDocumentsMesure({
        collectiviteId,
        actionId: 'inconnu_1.1.4',
      })
    ).rejects.toThrow(
      "L'identifiant de mesure ne désigne aucun référentiel connu."
    );
  });
});
