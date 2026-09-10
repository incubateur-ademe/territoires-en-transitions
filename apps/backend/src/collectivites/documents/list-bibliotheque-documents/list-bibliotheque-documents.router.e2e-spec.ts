import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  seedTestDocument,
  TestDocument,
} from '@tet/backend/collectivites/documents/documents.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import {
  addAuditeurPermission,
  createAudit,
  CreateAuditArgs,
} from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
  addUserRoleSupport,
  TestUserArgs,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { randomUUID } from 'crypto';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../../test/app-utils';
import { ListBibliothequeDocumentsOutput } from './list-bibliotheque-documents.output';

const FORBIDDEN_MESSAGE = "Vous n'avez pas les permissions nécessaires";

const PUBLIC_CONFIDENTIEL = 'public-confidentiel.pdf';
const PUBLIC_NOT_CONFIDENTIEL = 'public-not-confidentiel.pdf';
const RESTRICTED_CONFIDENTIEL = 'restricted-confidentiel.pdf';
const RESTRICTED_NOT_CONFIDENTIEL = 'restricted-not-confidentiel.pdf';

const SEARCH_FILENAMES = [
  'Rapport-Annuel.pdf',
  'a_b.pdf',
  'axb.pdf',
  '100%.pdf',
  'a\\b.pdf',
];

type AuditeurFixture = {
  auditeur: AuthenticatedUser;
  restrictedCollectiviteId: number;
};

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const toListedDocument = ({
  id,
  filename,
  confidentiel,
}: TestDocument): ListBibliothequeDocumentsOutput['items'][number] => ({
  id,
  filename,
  confidentiel,
});

describe('ListBibliothequeDocumentsRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseServiceInterface;

  let publicCollectivite: Collectivite;
  let restrictedCollectivite: Collectivite;

  let publicLecteur: AuthenticatedUser;
  let publicEditeurFichesIndicateurs: AuthenticatedUser;
  let restrictedLecteur: AuthenticatedUser;
  let verifiedNonMember: AuthenticatedUser;
  let unverifiedUser: AuthenticatedUser;
  let ademeUser: AuthenticatedUser;
  let unverifiedAdemeUser: AuthenticatedUser;
  let supportUser: AuthenticatedUser;
  let superAdmin: AuthenticatedUser;
  let auditeurOfOngoingAudit: AuditeurFixture;
  let auditeurOfNotStartedAudit: AuditeurFixture;
  let auditeurOfValidatedAudit: AuditeurFixture;
  let auditeurOfAuditClosed5DaysAgo: AuditeurFixture;
  let auditeurOfAuditClosed30DaysAgo: AuditeurFixture;

  const addNonMemberUser = async (
    args: TestUserArgs = {}
  ): Promise<AuthenticatedUser> => {
    const { user } = await addTestUser(databaseService, args);
    return getAuthUserFromUserCredentials(user);
  };

  const seedConfidentielAndNotConfidentiel = async ({
    collectiviteId,
    confidentielFilename,
    notConfidentielFilename,
  }: {
    collectiviteId: number;
    confidentielFilename: string;
    notConfidentielFilename: string;
  }): Promise<void> => {
    await Promise.all([
      seedTestDocument({
        databaseService,
        collectiviteId,
        filename: confidentielFilename,
        confidentiel: true,
      }),
      seedTestDocument({
        databaseService,
        collectiviteId,
        filename: notConfidentielFilename,
      }),
    ]);
  };

  const addRestrictedCollectivite = async (
    users: Array<{ role: CollectiviteRole }>
  ): Promise<{ collectivite: Collectivite; membres: AuthenticatedUser[] }> => {
    const restrictedFixture = await addTestCollectiviteAndUsers(
      databaseService,
      { collectivite: { accesRestreint: true }, users }
    );
    await seedConfidentielAndNotConfidentiel({
      collectiviteId: restrictedFixture.collectivite.id,
      confidentielFilename: RESTRICTED_CONFIDENTIEL,
      notConfidentielFilename: RESTRICTED_NOT_CONFIDENTIEL,
    });
    return {
      collectivite: restrictedFixture.collectivite,
      membres: restrictedFixture.users.map((user) =>
        getAuthUserFromUserCredentials(user)
      ),
    };
  };

  const addAuditeurOfRestrictedCollectivite = async (
    audit: Omit<
      CreateAuditArgs,
      'databaseService' | 'collectiviteId' | 'referentielId'
    >
  ): Promise<AuditeurFixture> => {
    const { collectivite } = await addRestrictedCollectivite([]);
    const { audit: createdAudit } = await createAudit({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      ...audit,
    });
    const auditeur = await addNonMemberUser();
    await addAuditeurPermission({
      databaseService,
      auditId: createdAudit.id,
      userId: auditeur.id,
    });
    return { auditeur, restrictedCollectiviteId: collectivite.id };
  };

  const addCollectiviteWithLecteur = async (): Promise<{
    collectivite: Collectivite;
    lecteur: AuthenticatedUser;
  }> => {
    const collectiviteFixture = await addTestCollectiviteAndUsers(
      databaseService,
      { users: [{ role: CollectiviteRole.LECTURE }] }
    );
    return {
      collectivite: collectiviteFixture.collectivite,
      lecteur: getAuthUserFromUserCredentials(collectiviteFixture.users[0]),
    };
  };

  const seedDocuments = (
    collectivite: Collectivite,
    filenames: string[]
  ): Promise<TestDocument[]> =>
    Promise.all(
      filenames.map((filename) =>
        seedTestDocument({
          databaseService,
          collectiviteId: collectivite.id,
          filename,
        })
      )
    );

  const listFilenames = async (
    user: AuthenticatedUser,
    input: { collectiviteId: number; search?: string }
  ): Promise<string[]> => {
    const { items } = await router
      .createCaller({ user })
      .collectivites.documents.listBibliothequeDocuments({
        limit: 100,
        ...input,
      });
    return items.map(({ filename }) => filename);
  };

  const listFilenamesAsAuditeur = ({
    auditeur,
    restrictedCollectiviteId,
  }: AuditeurFixture): Promise<string[]> =>
    listFilenames(auditeur, { collectiviteId: restrictedCollectiviteId });

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const publicFixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [
        { role: CollectiviteRole.LECTURE },
        { role: CollectiviteRole.EDITION_FICHES_INDICATEURS },
      ],
    });
    publicCollectivite = publicFixture.collectivite;
    publicLecteur = getAuthUserFromUserCredentials(publicFixture.users[0]);
    publicEditeurFichesIndicateurs = getAuthUserFromUserCredentials(
      publicFixture.users[1]
    );
    await seedConfidentielAndNotConfidentiel({
      collectiviteId: publicCollectivite.id,
      confidentielFilename: PUBLIC_CONFIDENTIEL,
      notConfidentielFilename: PUBLIC_NOT_CONFIDENTIEL,
    });

    const restrictedFixture = await addRestrictedCollectivite([
      { role: CollectiviteRole.LECTURE },
    ]);
    restrictedCollectivite = restrictedFixture.collectivite;
    restrictedLecteur = restrictedFixture.membres[0];

    verifiedNonMember = await addNonMemberUser();
    unverifiedUser = await addNonMemberUser({ verified: false });
    ademeUser = await addNonMemberUser({ nom: 'ademe' });
    unverifiedAdemeUser = await addNonMemberUser({
      nom: 'ademe',
      verified: false,
    });

    supportUser = await addNonMemberUser();
    await addUserRoleSupport({ databaseService, userId: supportUser.id });

    superAdmin = await addNonMemberUser();
    await addAndEnableUserSuperAdminMode({
      app,
      caller: router.createCaller({ user: superAdmin }),
      userId: superAdmin.id,
    });

    auditeurOfOngoingAudit = await addAuditeurOfRestrictedCollectivite({});
    auditeurOfNotStartedAudit = await addAuditeurOfRestrictedCollectivite({
      dateDebut: null,
    });
    auditeurOfValidatedAudit = await addAuditeurOfRestrictedCollectivite({
      valide: true,
    });
    auditeurOfAuditClosed5DaysAgo = await addAuditeurOfRestrictedCollectivite({
      clos: true,
      dateFin: daysAgo(5),
    });
    auditeurOfAuditClosed30DaysAgo = await addAuditeurOfRestrictedCollectivite({
      clos: true,
      dateFin: daysAgo(30),
    });

    return async () => {
      await app.close();
    };
  });

  describe('autorisation', () => {
    test('rend à un membre en lecture les documents de sa collectivité, confidentiels compris, et eux seuls', async () => {
      expect(
        await listFilenames(publicLecteur, {
          collectiviteId: publicCollectivite.id,
        })
      ).toEqual([PUBLIC_CONFIDENTIEL, PUBLIC_NOT_CONFIDENTIEL]);
    });

    test('rend à un membre en édition des fiches et indicateurs les confidentiels de sa collectivité', async () => {
      expect(
        await listFilenames(publicEditeurFichesIndicateurs, {
          collectiviteId: publicCollectivite.id,
        })
      ).toEqual([PUBLIC_CONFIDENTIEL, PUBLIC_NOT_CONFIDENTIEL]);
    });

    test('rend à un membre en lecture tous les documents de sa collectivité en accès restreint', async () => {
      expect(
        await listFilenames(restrictedLecteur, {
          collectiviteId: restrictedCollectivite.id,
        })
      ).toEqual([RESTRICTED_CONFIDENTIEL, RESTRICTED_NOT_CONFIDENTIEL]);
    });

    test("rend à un compte vérifié non membre les seuls non confidentiels d'une collectivité publique", async () => {
      expect(
        await listFilenames(verifiedNonMember, {
          collectiviteId: publicCollectivite.id,
        })
      ).toEqual([PUBLIC_NOT_CONFIDENTIEL]);
    });

    test('ne rend pas à un compte vérifié non membre les confidentiels que sa recherche désigne', async () => {
      expect(
        await listFilenames(verifiedNonMember, {
          collectiviteId: publicCollectivite.id,
          search: 'confidentiel',
        })
      ).toEqual([PUBLIC_NOT_CONFIDENTIEL]);
    });

    test('refuse à un compte vérifié non membre une collectivité en accès restreint', async () => {
      await expect(
        listFilenames(verifiedNonMember, {
          collectiviteId: restrictedCollectivite.id,
        })
      ).rejects.toThrowError(FORBIDDEN_MESSAGE);
    });

    test('refuse à un compte non vérifié une collectivité publique', async () => {
      await expect(
        listFilenames(unverifiedUser, { collectiviteId: publicCollectivite.id })
      ).rejects.toThrowError(FORBIDDEN_MESSAGE);
    });

    test('refuse à un compte non vérifié une collectivité en accès restreint', async () => {
      await expect(
        listFilenames(unverifiedUser, {
          collectiviteId: restrictedCollectivite.id,
        })
      ).rejects.toThrowError(FORBIDDEN_MESSAGE);
    });

    test("rend à un compte ADEME les seuls non confidentiels d'une collectivité publique", async () => {
      expect(
        await listFilenames(ademeUser, {
          collectiviteId: publicCollectivite.id,
        })
      ).toEqual([PUBLIC_NOT_CONFIDENTIEL]);
    });

    test('refuse à un compte ADEME une collectivité en accès restreint', async () => {
      await expect(
        listFilenames(ademeUser, { collectiviteId: restrictedCollectivite.id })
      ).rejects.toThrowError(FORBIDDEN_MESSAGE);
    });

    test("rend à un compte ADEME non vérifié les seuls non confidentiels d'une collectivité publique", async () => {
      expect(
        await listFilenames(unverifiedAdemeUser, {
          collectiviteId: publicCollectivite.id,
        })
      ).toEqual([PUBLIC_NOT_CONFIDENTIEL]);
    });

    test('refuse à un compte ADEME non vérifié une collectivité en accès restreint', async () => {
      await expect(
        listFilenames(unverifiedAdemeUser, {
          collectiviteId: restrictedCollectivite.id,
        })
      ).rejects.toThrowError(FORBIDDEN_MESSAGE);
    });

    test("rend au support, mode super admin inactif, les seuls non confidentiels d'une collectivité publique", async () => {
      expect(
        await listFilenames(supportUser, {
          collectiviteId: publicCollectivite.id,
        })
      ).toEqual([PUBLIC_NOT_CONFIDENTIEL]);
    });

    test('refuse au support, mode super admin inactif, une collectivité en accès restreint', async () => {
      await expect(
        listFilenames(supportUser, {
          collectiviteId: restrictedCollectivite.id,
        })
      ).rejects.toThrowError(FORBIDDEN_MESSAGE);
    });

    test("rend au super admin, mode activé, tous les documents d'une collectivité en accès restreint", async () => {
      expect(
        await listFilenames(superAdmin, {
          collectiviteId: restrictedCollectivite.id,
        })
      ).toEqual([RESTRICTED_CONFIDENTIEL, RESTRICTED_NOT_CONFIDENTIEL]);
    });

    test("rend à l'auditeur d'un audit en cours tous les documents de la collectivité en accès restreint", async () => {
      expect(await listFilenamesAsAuditeur(auditeurOfOngoingAudit)).toEqual([
        RESTRICTED_CONFIDENTIEL,
        RESTRICTED_NOT_CONFIDENTIEL,
      ]);
    });

    test("rend à l'auditeur d'un audit non démarré tous les documents de la collectivité en accès restreint", async () => {
      expect(await listFilenamesAsAuditeur(auditeurOfNotStartedAudit)).toEqual([
        RESTRICTED_CONFIDENTIEL,
        RESTRICTED_NOT_CONFIDENTIEL,
      ]);
    });

    test("rend à l'auditeur d'un audit validé non clos tous les documents de la collectivité en accès restreint", async () => {
      expect(await listFilenamesAsAuditeur(auditeurOfValidatedAudit)).toEqual([
        RESTRICTED_CONFIDENTIEL,
        RESTRICTED_NOT_CONFIDENTIEL,
      ]);
    });

    test("rend à l'auditeur d'un audit clos depuis 5 jours tous les documents de la collectivité en accès restreint", async () => {
      expect(
        await listFilenamesAsAuditeur(auditeurOfAuditClosed5DaysAgo)
      ).toEqual([RESTRICTED_CONFIDENTIEL, RESTRICTED_NOT_CONFIDENTIEL]);
    });

    test("refuse à l'auditeur d'un audit clos depuis 30 jours la collectivité en accès restreint", async () => {
      await expect(
        listFilenamesAsAuditeur(auditeurOfAuditClosed30DaysAgo)
      ).rejects.toThrowError(FORBIDDEN_MESSAGE);
    });
  });

  test('rend les premiers documents par nom puis par identifiant, dans la limite demandée', async () => {
    const { collectivite, lecteur } = await addCollectiviteWithLecteur();
    const [, b, firstC, a, secondC, d] = await seedDocuments(collectivite, [
      'e.pdf',
      'b.pdf',
      'c.pdf',
      'a.pdf',
      'c.pdf',
      'd.pdf',
      'f.pdf',
    ]);
    const homonymsById = [firstC, secondC].toSorted(
      (first, second) => first.id - second.id
    );

    const { items } = await router
      .createCaller({ user: lecteur })
      .collectivites.documents.listBibliothequeDocuments({
        collectiviteId: collectivite.id,
        limit: 5,
      });

    expect(items).toEqual([a, b, ...homonymsById, d].map(toListedDocument));
  });

  describe('recherche', () => {
    let collectivite: Collectivite;
    let lecteur: AuthenticatedUser;

    beforeAll(async () => {
      ({ collectivite, lecteur } = await addCollectiviteWithLecteur());
      await seedDocuments(collectivite, SEARCH_FILENAMES);
    });

    test('trouve un document sans tenir compte de la casse', async () => {
      expect(
        await listFilenames(lecteur, {
          collectiviteId: collectivite.id,
          search: 'rapport-annuel',
        })
      ).toEqual(['Rapport-Annuel.pdf']);
    });

    test('prend le caractère _ au pied de la lettre', async () => {
      expect(
        await listFilenames(lecteur, {
          collectiviteId: collectivite.id,
          search: 'a_b',
        })
      ).toEqual(['a_b.pdf']);
    });

    test('prend le caractère % au pied de la lettre', async () => {
      expect(
        await listFilenames(lecteur, {
          collectiviteId: collectivite.id,
          search: '%',
        })
      ).toEqual(['100%.pdf']);
    });

    test('prend le caractère \\ au pied de la lettre', async () => {
      expect(
        await listFilenames(lecteur, {
          collectiviteId: collectivite.id,
          search: '\\',
        })
      ).toEqual(['a\\b.pdf']);
    });

    test("n'applique aucun filtre à une recherche faite d'espaces", async () => {
      const filenames = await listFilenames(lecteur, {
        collectiviteId: collectivite.id,
        search: '   ',
      });

      expect(filenames.toSorted()).toEqual(SEARCH_FILENAMES.toSorted());
    });
  });

  test("n'affiche pas un document de la bibliothèque sans objet de stockage", async () => {
    const { collectivite, lecteur } = await addCollectiviteWithLecteur();

    await seedDocuments(collectivite, ['present.pdf']);
    await databaseService.db.insert(bibliothequeFichierTable).values({
      collectiviteId: collectivite.id,
      hash: randomUUID(),
      filename: 'sans-objet.pdf',
      confidentiel: false,
    });

    expect(
      await listFilenames(lecteur, { collectiviteId: collectivite.id })
    ).toEqual(['present.pdf']);
  });
});
