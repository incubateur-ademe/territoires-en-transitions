import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  pcaetAvisAuTitreDeValues,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { desc, eq } from 'drizzle-orm';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { CloreInstructionService } from './clore-instruction.service';

describe('Clôture de l’instruction PCAET', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let service: CloreInstructionService;
  let instructeurCollectiviteId: number;

  // Un code région propre à cette spec : l'index unique « une DREAL par région »
  // ne tolère pas deux specs sur le même code.
  const REGION = '02';

  /** Démontage des collectivités créées par les cas, dans l'ordre inverse. */
  const nettoyages: (() => Promise<void>)[] = [];

  const hier = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const dansTroisMois = () =>
    new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();

  /**
   * Un dossier transmis, avec sa déposante et sa demande d'avis.
   *
   * Une déposante par dossier : `demarche_active_unique` n'autorise qu'une
   * démarche active par collectivité, et les cas laissent derrière eux des
   * dossiers en élaboration ou transmis.
   */
  const dossier = async ({
    status,
    avisDeadlineAt,
    titresValides = [],
  }: {
    status: DemarchePcaetStatus;
    avisDeadlineAt: string;
    titresValides?: (typeof pcaetAvisAuTitreDeValues)[number][];
  }) => {
    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test clôture' },
    });
    const collectiviteId = deposante.collectivite.id;

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: 'pcaet',
        titre: 'PCAET test clôture',
        status,
        transmittedAt: hier(),
        avisDeadlineAt,
      })
      .returning({ id: demarcheTable.id });

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });

    for (const auTitreDe of titresValides) {
      await db.db.insert(pcaetAvisTable).values({
        demandeAvisId: demande.id,
        emetteurCollectiviteId: instructeurCollectiviteId,
        auTitreDe,
        sens: 'favorable',
        fichierRef: 'avis.pdf',
        valideLe: new Date().toISOString(),
      });
    }

    nettoyages.push(async () => {
      const demandes = await db.db
        .select({ id: pcaetDemandeAvisTable.id })
        .from(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.demarcheId, demarche.id));
      for (const { id } of demandes) {
        await db.db
          .delete(pcaetAvisTable)
          .where(eq(pcaetAvisTable.demandeAvisId, id));
      }
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.demarcheId, demarche.id));
      await db.db
        .delete(demarcheStatusHistoryTable)
        .where(eq(demarcheStatusHistoryTable.demarcheId, demarche.id));
      await db.db
        .delete(demarcheTable)
        .where(eq(demarcheTable.id, demarche.id));
      await deposante.cleanup();
    });

    return { demarcheId: demarche.id, collectiviteId };
  };

  const statutDe = async (demarcheId: number) => {
    const [row] = await db.db
      .select({ status: demarcheTable.status })
      .from(demarcheTable)
      .where(eq(demarcheTable.id, demarcheId));
    return row.status;
  };

  const derniereTransition = async (demarcheId: number) => {
    const [row] = await db.db
      .select({ transition: demarcheStatusHistoryTable.transition })
      .from(demarcheStatusHistoryTable)
      .where(eq(demarcheStatusHistoryTable.demarcheId, demarcheId))
      .orderBy(desc(demarcheStatusHistoryTable.id))
      .limit(1);
    return row?.transition;
  };

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    service = app.get(CloreInstructionService);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test clôture',
      },
    });
    instructeurCollectiviteId = dreal.collectivite.id;

    // Les dossiers retiennent leur collectivité : sans ce démontage, la DREAL
    // survivrait au test et la prochaine exécution buterait sur l'index unique
    // « une DREAL par région ».
    return async () => {
      for (const nettoyer of nettoyages.reverse()) {
        await nettoyer();
      }
      await dreal.cleanup();
      await app.close();
    };
  });

  it('clôt sur le délai échu, et le journal le dit', async () => {
    const cible = await dossier({
      status: 'transmis_pour_avis',
      avisDeadlineAt: hier(),
    });

    const result = await service.clore(cible);
    expect(result.success && result.data?.status).toBe('instruit');
    expect(await derniereTransition(cible.demarcheId)).toBe('delai_avis_echu');
  });

  it('clôt sur les avis tous rendus, échéance encore ouverte', async () => {
    const cible = await dossier({
      status: 'transmis_pour_avis',
      avisDeadlineAt: dansTroisMois(),
      titresValides: [...pcaetAvisAuTitreDeValues],
    });

    const result = await service.clore(cible);
    expect(result.success && result.data?.status).toBe('instruit');
    // Les avis priment sur le délai : c'est leur remise qui a clos l'instruction.
    expect(await derniereTransition(cible.demarcheId)).toBe('avis_tous_rendus');
  });

  // Reprendre l'élaboration n'annule pas les avis déjà rendus : les instances
  // continuent d'instruire le dossier qu'on leur a transmis.
  it('clôt un dossier repassé en élaboration dès que tous les avis sont là', async () => {
    const cible = await dossier({
      status: 'en_elaboration',
      avisDeadlineAt: dansTroisMois(),
      titresValides: [...pcaetAvisAuTitreDeValues],
    });

    const result = await service.clore(cible);
    expect(result.success && result.data?.status).toBe('instruit');
    expect(await derniereTransition(cible.demarcheId)).toBe('avis_tous_rendus');
  });

  it('ne fait rien quand il manque un titre et que le délai court', async () => {
    const cible = await dossier({
      status: 'transmis_pour_avis',
      avisDeadlineAt: dansTroisMois(),
      titresValides: ['prefet_region'],
    });

    expect(await service.clore(cible)).toEqual({ success: true, data: null });
    expect(await statutDe(cible.demarcheId)).toBe('transmis_pour_avis');
  });

  it('est idempotent sur un dossier déjà instruit', async () => {
    const cible = await dossier({
      status: 'transmis_pour_avis',
      avisDeadlineAt: hier(),
    });
    await service.clore(cible);

    expect(await service.clore(cible)).toEqual({ success: true, data: null });
    expect(await statutDe(cible.demarcheId)).toBe('instruit');
  });

  // La passe du planificateur doit voir les deux chemins. Ne filtrer que sur
  // l'échéance la rendait aveugle aux dossiers dont les avis sont tous rendus.
  it('la passe en lot ramasse les deux chemins', async () => {
    const parLeDelai = await dossier({
      status: 'transmis_pour_avis',
      avisDeadlineAt: hier(),
    });
    const parLesAvis = await dossier({
      status: 'transmis_pour_avis',
      avisDeadlineAt: dansTroisMois(),
      titresValides: [...pcaetAvisAuTitreDeValues],
    });

    const result = await service.cloreInstructions();
    expect(result.success).toBe(true);

    expect(await statutDe(parLeDelai.demarcheId)).toBe('instruit');
    expect(await statutDe(parLesAvis.demarcheId)).toBe('instruit');
  });
});
