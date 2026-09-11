import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectivitePerimetreSecondaireTable } from '@tet/backend/collectivites/shared/models/collectivite-perimetre-secondaire.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { collectiviteNature } from '@tet/domain/collectivites';
import {
  DemarchePcaetObligationEnum,
  estNaturePorteusePcaet,
  PcaetStatutInstructionEnum,
  SEUIL_POPULATION_PCAET,
  STATUTS_INSTRUCTION_PAR_DEFAUT,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { inArray } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { NATURES_PORTEUSES_PCAET } from './list-dossiers-instruction.repository';

describe('listDossiersInstruction', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let agentNational: AuthenticatedUser;
  let drealId: number;
  let serviceNationalId: number;
  let sansDepotId: number;
  const demarcheIds: number[] = [];

  // Un code propre à cette spec, dans l'espace réservé aux codes figés — une
  // lettre puis un chiffre. Voir `pickFreeRegionCode` pour les trois espaces.
  const REGION = 'N1';
  const AUTRE_REGION = 'N2';

  const dansNJours = (n: number) =>
    new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();

  const appeler = (user: AuthenticatedUser, input: Record<string, unknown>) =>
    router.createCaller({ user }).demarches.pcaet.listDossiersInstruction({
      collectiviteId: drealId,
      ...input,
    });

  /** Tous les statuts : ce que l'écran montre quand l'agent ouvre le filtre. */
  const TOUS_STATUTS = Object.values(PcaetStatutInstructionEnum);

  const creerDossier = async ({
    collectiviteId,
    status,
    avisDeadlineAt = null,
    launchedAt = null,
    obligation,
    avis,
    perimetre = 'principal',
    saisi = true,
  }: {
    collectiviteId: number;
    status: 'en_elaboration' | 'transmis_pour_avis' | 'publie' | 'archive';
    avisDeadlineAt?: string | null;
    launchedAt?: string | null;
    obligation?: 'obligatoire' | 'volontaire';
    avis?: { valide: boolean };
    perimetre?: 'principal' | 'secondaire';
    /**
     * Un dépôt en élaboration n'a pas encore saisi qui que ce soit ; un dépôt
     * transmis peut l'être resté, si le service est entré dans le dispositif
     * après coup.
     */
    saisi?: boolean;
  }) => {
    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: 'pcaet',
        titre: 'PCAET test dossiers instruction',
        status,
        obligation,
        launchedAt,
        // La transmission ne dépend pas de la saisine : c'est justement le cas
        // que `rattraper-saisines-pcaet` répare.
        transmittedAt: status === 'en_elaboration' ? null : dansNJours(-30),
        avisDeadlineAt,
      })
      .returning({ id: demarcheTable.id });
    demarcheIds.push(demarche.id);

    if (!saisi) {
      return { demarcheId: demarche.id, demandeId: null };
    }

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId: drealId,
        source: 'seed',
        perimetre,
      })
      .returning({ id: pcaetDemandeAvisTable.id });

    if (avis) {
      await db.db.insert(pcaetAvisTable).values({
        demandeAvisId: demande.id,
        emetteurCollectiviteId: drealId,
        auTitreDe: 'prefet_region',
        sens: 'favorable',
        fichierRef: avis.valide ? 'avis/test.pdf' : null,
        valideLe: avis.valide ? new Date().toISOString() : null,
      });
    }

    return { demarcheId: demarche.id, demandeId: demande.id };
  };

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test dossiers instruction',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);
    drealId = dreal.collectivite.id;

    const aInstruire = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN, prenom: 'Zoe', nom: 'Martin' },
      collectivite: {
        regionCode: REGION,
        departementCode: '54',
        nom: 'Zitrone Agglo',
      },
    });
    marie = getAuthUserFromUserCredentials(aInstruire.user);

    const instruit = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN, prenom: 'Alice', nom: 'Bernard' },
      collectivite: {
        regionCode: REGION,
        departementCode: '67',
        nom: 'Abricot Communaute',
      },
    });

    // Une collectivité porteuse qui n'a jamais rien déposé : c'est elle que le
    // service doit pouvoir relancer, et qui n'existait pas dans l'ancienne
    // liste. Au-dessus du seuil, donc assujettie.
    const sansDepot = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        regionCode: REGION,
        nom: 'Nectarine Agglo sans depot',
        natureInsee: 'CA',
        population: SEUIL_POPULATION_PCAET + 5_000,
      },
    });
    sansDepotId = sansDepot.collectivite.id;

    // En deçà du seuil : porteuse, donc listée, mais volontaire.
    const petiteSansDepot = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        regionCode: REGION,
        nom: 'Prune CC sans depot',
        natureInsee: 'CC',
        population: SEUIL_POPULATION_PCAET - 5_000,
      },
    });

    // Un dépôt en chantier : la démarche existe, personne n'est encore saisi.
    const enElaboration = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Cerise Agglo en cours' },
    });

    const horsPerimetre = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: AUTRE_REGION, nom: 'Melon Metropole' },
    });

    await creerDossier({
      collectiviteId: aInstruire.collectivite.id,
      status: 'transmis_pour_avis',
      avisDeadlineAt: dansNJours(60),
      launchedAt: dansNJours(-200),
      obligation: DemarchePcaetObligationEnum.OBLIGATOIRE,
    });
    await creerDossier({
      collectiviteId: instruit.collectivite.id,
      status: 'transmis_pour_avis',
      avisDeadlineAt: dansNJours(10),
      launchedAt: dansNJours(-400),
      obligation: DemarchePcaetObligationEnum.VOLONTAIRE,
      avis: { valide: true },
    });
    await creerDossier({
      collectiviteId: enElaboration.collectivite.id,
      status: 'en_elaboration',
      launchedAt: dansNJours(-100),
      saisi: false,
    });
    await creerDossier({
      collectiviteId: horsPerimetre.collectivite.id,
      status: 'transmis_pour_avis',
      avisDeadlineAt: dansNJours(20),
    });

    const serviceNational = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'service_national',
        nom: 'Service national test dossiers instruction',
      },
    });
    serviceNationalId = serviceNational.collectivite.id;
    agentNational = getAuthUserFromUserCredentials(serviceNational.user);

    return async () => {
      await serviceNational.cleanup();
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(inArray(pcaetDemandeAvisTable.demarcheId, demarcheIds));
      await db.db
        .delete(demarcheTable)
        .where(inArray(demarcheTable.id, demarcheIds));
      await horsPerimetre.cleanup();
      await enElaboration.cleanup();
      await petiteSansDepot.cleanup();
      await sansDepot.cleanup();
      await instruit.cleanup();
      await aInstruire.cleanup();
      await dreal.cleanup();
      await app.close();
    };
  });

  describe('assiette du périmètre', () => {
    it('ne sort pas du périmètre de la DREAL', async () => {
      const result = await appeler(camille, { statuts: TOUS_STATUTS });

      expect(result.items.map((item) => item.collectivite.nom)).not.toContain(
        'Melon Metropole'
      );
    });

    it('le filtre par défaut reproduit ce que montrait la liste des saisines', async () => {
      const result = await appeler(camille, {});

      // Ni les dépôts en chantier, ni les collectivités absentes : le défaut ne
      // doit pas ouvrir l'écran sur un territoire entier.
      expect(result.items.map((item) => item.collectivite.nom).sort()).toEqual([
        'Abricot Communaute',
        'Zitrone Agglo',
      ]);
      expect(STATUTS_INSTRUCTION_PAR_DEFAUT).not.toContain(
        PcaetStatutInstructionEnum.AUCUN_DEPOT
      );
    });

    it('dit le volume du périmètre, que les filtres ne réduisent pas', async () => {
      // Ce qui distingue « rien à instruire » de « ces filtres ne rendent
      // rien » : sans cette donnée, l'écran masquerait ses propres filtres.
      const parDefaut = await appeler(camille, {});
      const etroit = await appeler(camille, {
        statuts: [PcaetStatutInstructionEnum.ARCHIVE],
      });

      expect(etroit.total).toBe(0);
      expect(etroit.totalPerimetre).toBe(parDefaut.totalPerimetre);
      expect(etroit.totalPerimetre).toBeGreaterThan(0);
    });

    it('ne filtre rien quand la liste de statuts est vide', async () => {
      // « Désélectionner les options » veut dire « ne trie rien », pas « ne
      // montre rien » : la liste vide doit rendre autant que la liste pleine.
      const vide = await appeler(camille, { statuts: [], limit: 200 });
      const tous = await appeler(camille, {
        statuts: TOUS_STATUTS,
        limit: 200,
      });

      expect(vide.total).toBe(tous.total);
      expect(vide.total).toBeGreaterThan(0);
    });

    it('fait apparaître une collectivité porteuse qui n’a rien déposé', async () => {
      const result = await appeler(camille, {
        statuts: [PcaetStatutInstructionEnum.AUCUN_DEPOT],
      });

      const noms = result.items.map((item) => item.collectivite.nom);
      expect(noms).toContain('Nectarine Agglo sans depot');
      expect(noms).toContain('Prune CC sans depot');
    });

    it('n’invente pas de ligne pour une collectivité qui ne porte pas de PCAET', async () => {
      // Les collectivités de test naissent sans nature juridique : sans dépôt,
      // elles n'ont pas à figurer dans le territoire d'un service.
      const result = await appeler(camille, {
        statuts: [PcaetStatutInstructionEnum.AUCUN_DEPOT],
      });

      expect(result.items.map((item) => item.collectivite.nom)).not.toContain(
        'Zitrone Agglo'
      );
    });

    it('garde la liste des natures porteuses d’accord avec le domaine', async () => {
      // La requête filtre l'assiette en SQL et ne peut pas appeler la règle :
      // les deux doivent dire la même chose.
      const porteusesDomaine = collectiviteNature.filter((nature) =>
        estNaturePorteusePcaet(nature)
      );
      expect([...NATURES_PORTEUSES_PCAET].sort()).toEqual(
        [...porteusesDomaine].sort()
      );
    });
  });

  describe('statuts', () => {
    it('distingue un dépôt en élaboration, qui n’a saisi personne', async () => {
      const result = await appeler(camille, {
        statuts: [PcaetStatutInstructionEnum.EN_ELABORATION],
      });

      const ligne = result.items.find(
        (item) => item.collectivite.nom === 'Cerise Agglo en cours'
      );
      expect(ligne?.statut).toBe(PcaetStatutInstructionEnum.EN_ELABORATION);
      // Rien à consulter : sans saisine, le dossier n'est pas ouvert au
      // service, qui n'a là qu'un motif de relance.
      expect(ligne?.demandeAvisId).toBeNull();
      expect(ligne?.demarcheId).not.toBeNull();
    });

    it('laisse coexister un PCAET abouti et son renouvellement', async () => {
      const collectivite = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
        collectivite: { regionCode: REGION, nom: 'Figue Agglo renouvelle' },
      });
      onTestFinished(async () => {
        await collectivite.cleanup();
      });

      await creerDossier({
        collectiviteId: collectivite.collectivite.id,
        status: 'publie',
        launchedAt: dansNJours(-2000),
      });
      await creerDossier({
        collectiviteId: collectivite.collectivite.id,
        status: 'en_elaboration',
        launchedAt: dansNJours(-50),
        saisi: false,
      });

      const result = await appeler(camille, { statuts: TOUS_STATUTS });
      const lignes = result.items.filter(
        (item) => item.collectivite.nom === 'Figue Agglo renouvelle'
      );

      // Deux dossiers, deux lignes : le cycle achevé et celui qui reprend. Le
      // renouvellement n'a pas de statut à lui — le workflow est linéaire, il
      // repart d'une élaboration comme un premier dépôt.
      expect(lignes.map((ligne) => ligne.statut).sort()).toEqual([
        PcaetStatutInstructionEnum.ADOPTE,
        PcaetStatutInstructionEnum.EN_ELABORATION,
      ]);
    });

    it('dit « adopté » d’un PCAET publié', async () => {
      const result = await appeler(camille, { statuts: TOUS_STATUTS });
      const publies = result.items.filter(
        (item) => item.demarcheStatus === 'publie'
      );

      for (const ligne of publies) {
        expect(ligne.statut).toBe(PcaetStatutInstructionEnum.ADOPTE);
      }
    });
  });

  describe('obligation', () => {
    it('retient celle que la collectivité a déclarée sur son dépôt', async () => {
      const result = await appeler(camille, {});
      const parNom = new Map(
        result.items.map((item) => [
          item.collectivite.nom,
          { obligation: item.obligation, source: item.obligationSource },
        ])
      );

      expect(parNom.get('Zitrone Agglo')).toEqual({
        obligation: DemarchePcaetObligationEnum.OBLIGATOIRE,
        source: 'demarche',
      });
      expect(parNom.get('Abricot Communaute')).toEqual({
        obligation: DemarchePcaetObligationEnum.VOLONTAIRE,
        source: 'demarche',
      });
    });

    it('la déduit de la collectivité quand aucun dépôt ne la porte', async () => {
      const result = await appeler(camille, {
        statuts: [PcaetStatutInstructionEnum.AUCUN_DEPOT],
      });
      const parNom = new Map(
        result.items.map((item) => [
          item.collectivite.nom,
          { obligation: item.obligation, source: item.obligationSource },
        ])
      );

      expect(parNom.get('Nectarine Agglo sans depot')).toEqual({
        obligation: DemarchePcaetObligationEnum.OBLIGATOIRE,
        source: 'assujettissement',
      });
      expect(parNom.get('Prune CC sans depot')).toEqual({
        obligation: DemarchePcaetObligationEnum.VOLONTAIRE,
        source: 'assujettissement',
      });
    });

    it('filtre sur l’obligation', async () => {
      const result = await appeler(camille, {
        statuts: [PcaetStatutInstructionEnum.AUCUN_DEPOT],
        obligations: [DemarchePcaetObligationEnum.OBLIGATOIRE],
      });

      expect(result.items.map((item) => item.collectivite.nom)).toEqual([
        'Nectarine Agglo sans depot',
      ]);
    });
  });

  describe('tris', () => {
    it('trie par échéance décroissante par défaut', async () => {
      const result = await appeler(camille, {});

      // L'échéance vaut la transmission plus le délai légal : la décroissante
      // met donc les dossiers transmis le plus récemment en tête.
      expect(result.items.map((item) => item.collectivite.nom)).toEqual([
        'Zitrone Agglo',
        'Abricot Communaute',
      ]);
    });

    it('trie par date de début dans les deux sens', async () => {
      const asc = await appeler(camille, {
        sort: 'dateDebut',
        direction: 'asc',
      });
      const desc = await appeler(camille, {
        sort: 'dateDebut',
        direction: 'desc',
      });

      expect(asc.items.map((item) => item.collectivite.nom)).toEqual([
        'Abricot Communaute',
        'Zitrone Agglo',
      ]);
      expect(desc.items.map((item) => item.collectivite.nom)).toEqual([
        'Zitrone Agglo',
        'Abricot Communaute',
      ]);
    });

    it('laisse les lignes sans date en dernier, dans les deux sens', async () => {
      const dernierNom = async (direction: 'asc' | 'desc') => {
        const result = await appeler(camille, {
          statuts: [
            PcaetStatutInstructionEnum.AUCUN_DEPOT,
            PcaetStatutInstructionEnum.EN_INSTRUCTION,
          ],
          sort: 'dateDebut',
          direction,
          limit: 200,
        });
        return result.items.at(-1)?.launchedAt;
      };

      // Une collectivité sans dépôt n'a pas de date de début : la voir ouvrir
      // un tri antéchronologique n'apprendrait rien.
      expect(await dernierNom('asc')).toBeNull();
      expect(await dernierNom('desc')).toBeNull();
    });

    it('trie par statut dans l’ordre du cycle', async () => {
      const asc = await appeler(camille, { sort: 'statut', direction: 'asc' });
      const desc = await appeler(camille, {
        sort: 'statut',
        direction: 'desc',
      });

      expect(asc.items.map((item) => item.statut)).toEqual([
        PcaetStatutInstructionEnum.EN_INSTRUCTION,
        PcaetStatutInstructionEnum.INSTRUIT,
      ]);
      expect(desc.items.map((item) => item.statut)).toEqual([
        PcaetStatutInstructionEnum.INSTRUIT,
        PcaetStatutInstructionEnum.EN_INSTRUCTION,
      ]);
    });

    it('trie par contact, qu’il faut avoir chargé avant de paginer', async () => {
      const asc = await appeler(camille, { sort: 'contact', direction: 'asc' });

      expect(asc.items.map((item) => item.contacts[0]?.prenom)).toEqual([
        'Alice',
        'Zoe',
      ]);
    });
  });

  describe('compteurs et pagination', () => {
    it('compte sur tout le périmètre, sans se laisser réduire par les filtres', async () => {
      const filtre = await appeler(camille, {
        statuts: [PcaetStatutInstructionEnum.EN_INSTRUCTION],
      });

      expect(filtre.items).toHaveLength(1);
      // Le filtre dit ce que l'agent regarde ; les compteurs, sa charge.
      expect(filtre.countByStatut.en_instruction).toBe(1);
      expect(filtre.countByStatut.instruit).toBe(1);
      expect(filtre.countByStatut.aucun_depot).toBe(2);
    });

    it('agrège le délai moyen sur tout le périmètre', async () => {
      const result = await appeler(camille, {});
      const premierePage = await appeler(camille, { limit: 1, page: 1 });

      // Un seul dossier a abouti — transmis il y a 30 jours, avis validé à
      // l'instant — et c'est le seul à peser sur la moyenne.
      expect(result.stats.delaiMoyenJours).toBe(30);
      expect(premierePage.items).toHaveLength(1);
      expect(premierePage.stats).toEqual(result.stats);
    });

    it('pagine sans perdre le total', async () => {
      const result = await appeler(camille, { limit: 1, page: 2 });

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].collectivite.nom).toBe('Abricot Communaute');
    });

    /**
     * Un lien partagé, un filtre resserré depuis la page 4 : la page demandée
     * peut ne plus exister. Rendre la dernière page garnie vaut mieux qu'un
     * tableau vide que l'écran expliquerait par « aucun résultat ».
     */
    it('ramène à la dernière page garnie quand la page demandée n’existe pas', async () => {
      const result = await appeler(camille, { limit: 1, page: 9 });

      expect(result.page).toBe(2);
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(1);
    });

    it('expose les contacts de la page', async () => {
      const result = await appeler(camille, { recherche: 'zitrone' });

      expect(result.items[0].contacts.map((c) => c.prenom)).toContain('Zoe');
    });
  });

  describe('régions du périmètre', () => {
    it('n’en donne qu’une à une DREAL', async () => {
      const result = await appeler(camille, {});

      expect(result.perimetreRegions.map(({ code }) => code)).toEqual([REGION]);
    });

    it('en donne deux à un service qui déborde sur une région voisine', async () => {
      await db.db.insert(collectivitePerimetreSecondaireTable).values({
        collectiviteId: drealId,
        regionCode: AUTRE_REGION,
        source: 'import_service_etat',
      });
      onTestFinished(async () => {
        await db.db
          .delete(collectivitePerimetreSecondaireTable)
          .where(
            inArray(collectivitePerimetreSecondaireTable.collectiviteId, [
              drealId,
            ])
          );
      });

      const result = await appeler(camille, { statuts: TOUS_STATUTS });

      // Le cas de la DR ADEME Océan Indien : La Réunion et Mayotte.
      expect(result.perimetreRegions.map(({ code }) => code).sort()).toEqual([
        REGION,
        AUTRE_REGION,
      ]);
      // Et le territoire suit : l'EPCI de la région voisine entre dans la liste.
      expect(result.items.map((item) => item.collectivite.nom)).toContain(
        'Melon Metropole'
      );
    });

    /**
     * Rien n'interdit à `collectivite_perimetre_secondaire` de répéter le code
     * du siège. Compté deux fois, il ferait apparaître la colonne « Région » à
     * une DREAL mono-région, avec deux fois la même option de filtre.
     */
    it('ne compte pas deux fois une région répétée par un périmètre secondaire', async () => {
      await db.db.insert(collectivitePerimetreSecondaireTable).values({
        collectiviteId: drealId,
        regionCode: REGION,
        source: 'import_service_etat',
      });
      onTestFinished(async () => {
        await db.db
          .delete(collectivitePerimetreSecondaireTable)
          .where(
            inArray(collectivitePerimetreSecondaireTable.collectiviteId, [
              drealId,
            ])
          );
      });

      const result = await appeler(camille, {});

      expect(result.perimetreRegions.map(({ code }) => code)).toEqual([REGION]);
    });

    it('filtre par région', async () => {
      const result = await appeler(camille, {
        statuts: TOUS_STATUTS,
        regionCodes: [AUTRE_REGION],
      });

      expect(result.items).toHaveLength(0);
    });
  });

  describe('service national', () => {
    const listerNational = (input: Record<string, unknown> = {}) =>
      router
        .createCaller({ user: agentNational })
        .demarches.pcaet.listDossiersInstruction({
          collectiviteId: serviceNationalId,
          statuts: Object.values(PcaetStatutInstructionEnum),
          ...input,
        });

    it('voit un dossier hors de tout périmètre régional', async () => {
      const result = await listerNational({ recherche: 'melon' });

      expect(result.items.map((item) => item.collectivite.nom)).toContain(
        'Melon Metropole'
      );
    });

    it('reçoit toutes les régions, de quoi filtrer une liste nationale', async () => {
      const result = await listerNational({ recherche: 'melon' });

      // Les dix-huit régions de `imports.region` : la colonne « Région » n'a de
      // sens que là, et c'est cette liste qui alimente son filtre.
      expect(result.perimetreRegions.length).toBeGreaterThanOrEqual(18);
    });

    it('ne se prononce pas, et lit donc l’état du dossier', async () => {
      const result = await listerNational({ recherche: 'melon' });

      expect(result.items[0].deposeAvis).toBe(false);
    });
  });

  describe('périmètre secondaire', () => {
    /**
     * Une même DREAL tient les deux rôles dans le même tableau : elle se
     * prononce sur les dossiers de sa région, et lit ceux des EPCI voisins qui
     * débordent chez elle.
     */
    it('apparaît en lecture et ne pèse pas sur les compteurs', async () => {
      const avant = await appeler(camille, {});

      const voisine = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
        collectivite: {
          regionCode: AUTRE_REGION,
          nom: 'EPCI voisin qui deborde',
        },
      });
      onTestFinished(async () => {
        await voisine.cleanup();
      });

      await db.db.insert(collectivitePerimetreSecondaireTable).values({
        collectiviteId: voisine.collectivite.id,
        regionCode: REGION,
        source: 'banatic',
      });

      const { demandeId } = await creerDossier({
        collectiviteId: voisine.collectivite.id,
        status: 'transmis_pour_avis',
        avisDeadlineAt: dansNJours(30),
        perimetre: 'secondaire',
      });

      const apres = await appeler(camille, {});

      const ligne = apres.items.find(
        (item) => item.demandeAvisId === demandeId
      );
      expect(ligne).toBeDefined();
      expect(ligne?.deposeAvis).toBe(false);
      expect(apres.total).toBe(avant.total + 1);

      // Ce n'est pas son travail : les compteurs de charge ne bougent pas, et
      // le délai moyen non plus.
      expect(apres.countByStatut).toEqual(avant.countByStatut);
      expect(apres.stats).toEqual(avant.stats);
    });
  });

  describe('dossier transmis sans saisine', () => {
    /**
     * Le cas d'un dossier parti avant que le service n'entre dans le
     * dispositif : le voir est utile — son échéance court —, mais le service n'a
     * pas la main pour le solder. La ligne se lit donc comme celle d'un
     * destinataire, et ne gonfle pas la charge annoncée par les compteurs.
     */
    it('se suit sans peser sur la charge du service', async () => {
      const avant = await appeler(camille, {});

      const oubliee = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
        collectivite: { regionCode: REGION, nom: 'Datte Agglo non saisie' },
      });
      onTestFinished(async () => {
        await oubliee.cleanup();
      });

      const { demarcheId } = await creerDossier({
        collectiviteId: oubliee.collectivite.id,
        status: 'transmis_pour_avis',
        avisDeadlineAt: dansNJours(30),
        saisi: false,
      });

      const apres = await appeler(camille, {});
      const ligne = apres.items.find((item) => item.demarcheId === demarcheId);

      expect(ligne).toBeDefined();
      expect(ligne?.demandeAvisId).toBeNull();
      // Pas de saisine, donc rien à déposer : l'écran affiche « Service non
      // saisi » plutôt qu'un lien qui ne mènerait nulle part.
      expect(ligne?.deposeAvis).toBe(false);
      // Le dossier, lui, est bien en instruction — menée par les services que
      // la transmission a effectivement saisis.
      expect(ligne?.statut).toBe(PcaetStatutInstructionEnum.EN_INSTRUCTION);

      expect(apres.countByStatut).toEqual(avant.countByStatut);
      expect(apres.stats).toEqual(avant.stats);
    });
  });

  it('refuse l’agente d’une collectivité déposante', async () => {
    await expect(appeler(marie, {})).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('ne dit rien d’une collectivité sans dépôt à qui ne la couvre pas', async () => {
    // Le service national la voit — il couvre le pays ; la DREAL de l'autre
    // région, non.
    const result = await listerAutreRegion();

    expect(result.items.map((item) => item.collectivite.id)).not.toContain(
      sansDepotId
    );
  });

  const listerAutreRegion = async () => {
    const autreDreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: AUTRE_REGION,
        nom: 'DREAL voisine test dossiers',
      },
    });
    onTestFinished(async () => {
      await autreDreal.cleanup();
    });

    return router
      .createCaller({ user: getAuthUserFromUserCredentials(autreDreal.user) })
      .demarches.pcaet.listDossiersInstruction({
        collectiviteId: autreDreal.collectivite.id,
        statuts: Object.values(PcaetStatutInstructionEnum),
        limit: 200,
      });
  };
});
