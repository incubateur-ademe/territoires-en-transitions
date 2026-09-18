import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@tet/backend/app.module';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectivitePerimetreSecondaireTable } from '@tet/backend/collectivites/shared/models/collectivite-perimetre-secondaire.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarchePiloteTable } from '@tet/backend/demarches/shared/models/demarche-pilote.table';
import { getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { CustomZodValidationPipe } from '@tet/backend/utils/nest/custom-zod-validation.pipe';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  collectiviteTypeEnum,
  type Collectivite,
} from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { NotifiedOnEnum } from '@tet/domain/utils';
import { and, eq, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  completeTestDossierPcaet,
  createDemarche,
  pickFreeRegionCode,
} from '../../demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '../../shared/models/pcaet-demande-avis.table';

/**
 * Les destinataires qui ne se prononcent pas.
 *
 * Trois façons de n'être que lecteur, et le message doit le dire dans les trois
 * cas : la famille du service (une DDT ne rend jamais d'avis), et le territoire
 * qui vaut la saisine — un service atteint par un périmètre secondaire de la
 * déposante lit le dossier, l'avis revenant au service du siège.
 */
describe('Notification de transmission aux destinataires en lecture', () => {
  let app: INestApplication;
  let db: DatabaseService;
  const sendEmail = vi.fn();

  /** Le corps du message reçu par cet agent. */
  const messageDe = (email: string): string => {
    const appel = sendEmail.mock.calls.find(([envoi]) => envoi.to === email);
    if (!appel) {
      throw new Error(`Aucun message envoyé à ${email}`);
    }
    return appel[0].html;
  };

  let ddtPrincipaleEmail: string;
  let regionSecondaireEmail: string;
  let ddtSecondaireEmail: string;
  let drealPrincipaleEmail: string;

  beforeAll(async () => {
    sendEmail.mockResolvedValue({ success: true, data: { messageId: 'test' } });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailService)
      .useValue({ sendEmail })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new CustomZodValidationPipe(app.get(ContextStoreService))
    );
    await app.init();

    const router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    // Le siège de la déposante, et les territoires qu'elle déborde.
    const regionSiege = await pickFreeRegionCode(
      db,
      collectiviteTypeEnum.DREAL
    );
    const regionVoisine = await pickFreeRegionCode(
      db,
      collectiviteTypeEnum.REGION
    );
    const departementSiege = await pickFreeDepartementCode(db);
    const departementVoisin = await pickFreeDepartementCode(db, [
      departementSiege,
    ]);

    const deposante = await createDemarche(db, router, {
      role: CollectiviteRole.ADMIN,
      collectivite: {
        regionCode: regionSiege,
        departementCode: departementSiege,
        nom: 'EPCI à cheval (test lecture)',
      },
    });
    const demarcheId = deposante.demarche.id;
    await db.db.insert(demarchePiloteTable).values({
      demarcheId,
      userId: deposante.user.id,
      createdBy: deposante.user.id,
    });

    // L'EPCI déborde sur une autre région et un autre département.
    await db.db.insert(collectivitePerimetreSecondaireTable).values([
      {
        collectiviteId: deposante.collectiviteId,
        source: 'import_service_etat',
        regionCode: regionVoisine,
      },
      {
        collectiviteId: deposante.collectiviteId,
        source: 'import_service_etat',
        departementCode: departementVoisin,
      },
    ]);

    const cleanups: Array<() => Promise<void>> = [];

    /** Un service instructeur peuplé d'un agent, donc notifiable. */
    const addService = async (
      nom: string,
      collectivite: Partial<Collectivite>
    ) => {
      const fixture = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
        collectivite: { nom, ...collectivite },
      });
      cleanups.push(fixture.cleanup);
      return fixture;
    };

    // Cas 1 — la DDT du département du siège : saisie au titre du périmètre
    // principal, mais sa famille ne rend jamais d'avis.
    const ddtPrincipale = await addService('DDT du siège (test lecture)', {
      type: collectiviteTypeEnum.DDT,
      regionCode: regionSiege,
      departementCode: departementSiege,
    });
    ddtPrincipaleEmail = ddtPrincipale.user.email;

    // Cas 2 — le conseil régional de la région voisine : sa famille rend un
    // avis, mais il n'est atteint que par un territoire secondaire.
    const regionSecondaire = await addService(
      'Conseil régional voisin (test lecture)',
      { type: collectiviteTypeEnum.REGION, regionCode: regionVoisine }
    );
    regionSecondaireEmail = regionSecondaire.user.email;

    // Cas 3 — la DDT du département voisin : les deux raisons cumulées.
    const ddtSecondaire = await addService('DDT voisine (test lecture)', {
      type: collectiviteTypeEnum.DDT,
      regionCode: regionVoisine,
      departementCode: departementVoisin,
    });
    ddtSecondaireEmail = ddtSecondaire.user.email;

    // Le contraste : la DREAL du siège, seule à être saisie pour avis.
    const drealPrincipale = await addService('DREAL du siège (test lecture)', {
      type: collectiviteTypeEnum.DREAL,
      regionCode: regionSiege,
    });
    drealPrincipaleEmail = drealPrincipale.user.email;

    await completeTestDossierPcaet(db, {
      collectiviteId: deposante.collectiviteId,
      demarcheId,
    });
    await deposante.caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: deposante.collectiviteId,
      demarcheId,
    });

    const demandes = await db.db
      .select({ id: pcaetDemandeAvisTable.id })
      .from(pcaetDemandeAvisTable)
      .where(eq(pcaetDemandeAvisTable.demarcheId, demarcheId));
    const entityIds = demandes.map(({ id }) => String(id));

    await db.db
      .update(notificationTable)
      .set({ sendAfter: DateTime.now().minus({ hours: 1 }).toUTC().toSQL() })
      .where(
        and(
          eq(
            notificationTable.notifiedOn,
            NotifiedOnEnum['DEMARCHES.PCAET.DOSSIER_TRANSMIS_POUR_AVIS']
          ),
          inArray(notificationTable.entityId, entityIds)
        )
      );
    await app.get(NotificationsService).sendPendingNotifications();

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.demarcheId, demarcheId));
      for (const cleanup of cleanups.reverse()) {
        await cleanup();
      }
      await app.close();
    };
  });

  it('écrit à la DDT du département du siège, sans parler de territoire limitrophe', () => {
    const message = messageDe(ddtPrincipaleEmail);

    expect(message).toContain('est destinataire de ce dossier');
    expect(message).toContain('avis à rendre sur un PCAET');
    // Elle est sur le territoire du siège : invoquer un territoire limitrophe
    // serait faux, c'est sa famille qui ne se prononce pas.
    expect(message).not.toContain('territoire limitrophe');
    expect(message).not.toContain('est saisi pour avis');
  });

  it("écrit au conseil régional voisin, que le siège de l'EPCI ne concerne pas", () => {
    // Sa famille rend un avis, mais pas sur ce dossier-là : l'avis revient au
    // conseil régional du siège, d'où la mention du territoire.
    const message = messageDe(regionSecondaireEmail);

    expect(message).toContain('est destinataire de ce dossier');
    expect(message).toContain('territoire limitrophe');
    expect(message).toContain('avis revient au service dont il dépend');
    expect(message).not.toContain('est saisi pour avis');
  });

  it('écrit à la DDT du département voisin, elle aussi pour information', () => {
    const message = messageDe(ddtSecondaireEmail);

    expect(message).toContain('est destinataire de ce dossier');
    expect(message).not.toContain('est saisi pour avis');
  });

  it('ne promet une échéance de remise des avis à aucun lecteur', () => {
    for (const email of [
      ddtPrincipaleEmail,
      regionSecondaireEmail,
      ddtSecondaireEmail,
    ]) {
      expect(messageDe(email)).not.toContain('Les avis sont attendus');
    }
  });

  it('réserve la formule « saisi pour avis » à la DREAL du siège', () => {
    const message = messageDe(drealPrincipaleEmail);

    expect(message).toContain('est saisi pour avis');
    expect(message).toContain('Les avis sont attendus avant le');
    expect(message).not.toContain('communiqué pour information');
  });
});

/**
 * Un code de département qu'aucune DDT n'occupe : l'index unique le refuserait.
 * Même principe que `pickFreeRegionCode`, sur l'autre maille.
 */
async function pickFreeDepartementCode(
  db: DatabaseService,
  exclus: string[] = []
): Promise<string> {
  const rows = await db.db
    .select({ departementCode: collectiviteTable.departementCode })
    .from(collectiviteTable)
    .where(eq(collectiviteTable.type, collectiviteTypeEnum.DDT));
  const pris = new Set([
    ...rows.map(({ departementCode }) => departementCode),
    ...exclus,
  ]);

  const lettre = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  for (let essai = 0; essai < 100; essai++) {
    const code = `${lettre()}${lettre()}`;
    if (!pris.has(code)) {
      return code;
    }
  }
  throw new Error('Aucun code de département libre après 100 tirages');
}
