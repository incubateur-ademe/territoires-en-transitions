import { Injectable, Logger } from '@nestjs/common';
import DatabaseService from '../../common/services/database.service';
import { AuthService } from '../../auth/services/auth.service';
import { GetFilteredIndicateursRequestType } from '../models/get-filtered-indicateurs.request';
import { sql } from 'drizzle-orm';
import { isNil } from 'es-toolkit';

/** Retour de la requête */
type IndicateurWithDetailsType = {
  id: number;
  identifiantReferentiel: string | null;
  titre: string | null;
  description: string | null;
  collectiviteId: number | null;
  groupementId: number | null;
  participationScore: boolean | null;
  valeurId: number | null;
  metadonneeId: number | null;
  categorieNom?: string | null;
  planId?: number | null;
  ficheId?: number | null;
  axeId?: number | null;
  serviceId?: number | null;
  thematiqueId?: number | null;
  piloteUserId?: string | null;
  piloteTagId?: number | null;
  confidentiel?: boolean | null;
  favoris?: boolean | null;
  parent?: number | null;
  enfant?: number | null;
  actionId?: string | null;
};

@Injectable()
export default class IndicateurFiltreService {
  private readonly logger = new Logger(IndicateurFiltreService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService
  ) {}

  /**
   * Récupère les indicateurs de la collectivité correspondant aux filtres donnés dans "options"
   * @param collectiviteId
   * @param options
   */
  async getFilteredIndicateurs(
    collectiviteId: number,
    options: GetFilteredIndicateursRequestType
  ) {
    // Vérifie s'il faut inclure les enfants dans le retour filtré ou dans le filtre des parents
    const avecEnfant =
      options.avecEnfants === true ||
      (options.text && options.text.startsWith('#')) === true;
    // Récupère tous les indicateurs de la collectivité ainsi que leurs tables liées utiles aux filtres voulus
    const indicateursRaw = await this.getIndicateursCollectiviteWithDetails(
      collectiviteId,
      options,
      avecEnfant
    );

    // Applique les différents filtres aux indicateurs de la collectivité
    const filteredIndicateurs = indicateursRaw.filter((indicateur) => {
      const parents = avecEnfant
        ? true
        : !indicateur.parents || indicateur.parents.length === 0;
      const participationScore = options.participationScore
        ? indicateur.participationScoreEnfant === true
        : true;
      const estConfidentiel = options.estConfidentiel
        ? indicateur.confidentielEnfant === true
        : true;
      const estFavoris = options.estFavorisCollectivite
        ? indicateur.favorisEnfant === true
        : true;
      const hasOpenData = options.hasOpenData
        ? indicateur.hasOpenDataEnfant
        : true;
      const categoriesNoms =
        options.categorieNoms && options.categorieNoms.length > 0
          ? this.hasCommunElement(
              options.categorieNoms,
              indicateur.categorieNomsEnfant
            )
          : true;
      const planActionIds =
        options.planActionIds && options.planActionIds.length > 0
          ? this.hasCommunElement(
              options.planActionIds,
              indicateur.planIdsEnfant
            )
          : true;
      const ficheActionIds =
        options.ficheActionIds && options.ficheActionIds.length > 0
          ? this.hasCommunElement(
              options.ficheActionIds,
              indicateur.ficheIdsEnfant
            )
          : true;
      const fichesNonClassees = options.fichesNonClassees
        ? indicateur.hasFichesNonClassees
        : true;
      const servicePiloteIds =
        options.servicePiloteIds && options.servicePiloteIds.length > 0
          ? this.hasCommunElement(
              options.servicePiloteIds,
              indicateur.serviceIdsEnfant
            )
          : true;
      const thematiqueIds =
        options.thematiqueIds && options.thematiqueIds.length > 0
          ? this.hasCommunElement(
              options.thematiqueIds,
              indicateur.thematiqueIdsEnfant
            )
          : true;
      const personnePiloteIds =
        options.personnePiloteIds && options.personnePiloteIds.length > 0
          ? this.hasCommunElement(
              options.personnePiloteIds,
              indicateur.piloteTagIdsEnfant
            )
          : true;
      const utilisateurPiloteIds =
        options.utilisateurPiloteIds && options.utilisateurPiloteIds.length > 0
          ? this.hasCommunElement(
              options.utilisateurPiloteIds,
              indicateur.piloteUserIdsEnfant
            )
          : true;
      const estComplet =
        options.estComplet === true
          ? indicateur.isCompletedEnfant
          : options.estComplet === false
          ? !indicateur.isCompletedEnfant
          : true;

      let text = true;
      if (options.text) {
        const nmText = this.normalizeString(options.text);
        if (options.text.startsWith('#')) {
          text = indicateur.identifiantReferentiel
            ? nmText.slice(1) ===
              this.normalizeString(indicateur.identifiantReferentiel)
            : false;
        } else {
          text =
            (indicateur.description
              ? this.normalizeString(indicateur.description).includes(nmText)
              : false) ||
            (indicateur.titre
              ? this.normalizeString(indicateur.titre).includes(nmText)
              : false);
        }
      }

      return (
        parents &&
        participationScore &&
        estConfidentiel &&
        estFavoris &&
        hasOpenData &&
        categoriesNoms &&
        planActionIds &&
        ficheActionIds &&
        fichesNonClassees &&
        servicePiloteIds &&
        thematiqueIds &&
        personnePiloteIds &&
        utilisateurPiloteIds &&
        estComplet &&
        text
      );
    });

    // TODO sort

    return filteredIndicateurs.map((indicateur) => ({
      id: indicateur.id,
      titre: indicateur.titre,
      estPerso: !isNil(indicateur.collectiviteId),
      identifiant: indicateur.identifiantReferentiel,
      hasOpenData: indicateur.hasOpenDataEnfant,
    }));
  }

  /**
   * Crée et exécute la requête permettant de récupérer les indicateurs de la collectivité ainsi que les tables liées utiles aux filtres voulus.
   * Applique le filtre options.estPerso
   * @param collectiviteId
   * @param options
   * @param avecEnfant
   */
  private async getIndicateursCollectiviteWithDetails(
    collectiviteId: number,
    options: GetFilteredIndicateursRequestType,
    avecEnfant: boolean
  ) {
    // Conditions utilisées pour les indicateurs et les catégories
    const conditionCollectivite = `collectivite_id = ${collectiviteId}`;
    const conditionCollectiviteGroupement = `(collectivite_id IS NULL AND groupement_id IS NULL)
        OR ${conditionCollectivite}
        OR groupement_id IN (SELECT groupement_id FROM groupements`;
    // Filtre sur estPerso
    const conditionCollectivitePerso = options.estPerso
      ? conditionCollectivite
      : conditionCollectiviteGroupement;

    // Début de la requête
    let query = sql`
      WITH groupements AS (SELECT DISTINCT groupement_id
                           FROM groupement_collectivite
                           WHERE collectivite_id = ${collectiviteId}),
           indicateurs AS (SELECT *
                           FROM indicateur_definition
                           WHERE ${conditionCollectivitePerso}
      SELECT i.id,
             i.identifiant_referentiel AS identifiantReferentiel,
             i.titre,
             i.description,
             i.collectivite_id         AS collectiviteId,
             i.groupement_id           AS groupementId,
             i.participation_score     AS participationScore,
             v.id                      AS valeurId,
             v.metadonnee_id           AS metadonneeId,
             ig_parent.parent          AS parent,
             ig_enfant.enfant          AS enfant,`;

    // Ne récupère que les attributs nécessaires aux filtres voulus
    if (options.categorieNoms && options.categorieNoms.length > 0) {
      query = sql`${query}
      ,
        ct.nom AS categorieNom`;
    }
    if (options.planActionIds && options.planActionIds.length > 0) {
      query = sql`${query}
      ,
        plan.id AS planId`;
    }
    if (
      (options.ficheActionIds && options.ficheActionIds.length > 0) ||
      options.fichesNonClassees
    ) {
      query = sql`${query}
      ,
        fa.id AS ficheId`;
    }
    if (options.fichesNonClassees) {
      query = sql`${query}
      ,
        faa.axe_id AS axeId`;
    }
    if (options.servicePiloteIds && options.servicePiloteIds.length > 0) {
      query = sql`${query}
      ,
        st.id AS serviceId`;
    }
    if (options.thematiqueIds && options.thematiqueIds.length > 0) {
      query = sql`${query}
      ,
        it.thematique_id AS thematiqueId`;
    }
    if (
      options.utilisateurPiloteIds &&
      options.utilisateurPiloteIds.length > 0
    ) {
      query = sql`${query}
      ,
        ip.user_id AS piloteUserId`;
    }
    if (options.personnePiloteIds && options.personnePiloteIds.length > 0) {
      query = sql`${query}
      ,
        ip.tag_id AS piloteTagId`;
    }
    if (options.estConfidentiel) {
      query = sql`${query}
      ,
        c.confidentiel AS confidentiel`;
    }
    if (options.estFavorisCollectivite) {
      query = sql`${query}
      ,
        c.favoris AS favoris`;
    }
    if (options.actionId) {
      query = sql`${query}
      ,
        ia.action_id AS actionId`;
    }

    const subrequest = `
      SELECT id, metadonnee_id
      FROM indicateur_valeur
      WHERE collectivite_id = ${collectiviteId}
        AND indicateur_id = i.id`;

    query = sql`${query}
    FROM indicateurs i`;
    query = sql`${query}
    LEFT JOIN LATERAL (${subrequest}) v ON true`;

    query = sql`${query}
                  LEFT JOIN indicateur_groupe ig_parent ON i.id = ig_parent.enfant
                  LEFT JOIN indicateur_groupe ig_enfant ON i.id = ig_enfant.parent`;

    // Ne requête que les tables liées nécessaires aux filtres voulus
    if (options.categorieNoms && options.categorieNoms.length > 0) {
      query = sql`${query}
                    LEFT JOIN LATERAL (
          SELECT ct.nom
          FROM categorie_tag ct
                 JOIN indicateur_categorie_tag ict ON ct.id = ict.categorie_tag_id
          WHERE ict.indicateur_id = i.id
            AND (${conditionCollectivitePerso})
            ) ct ON true
      `;
    }

    if (
      options.fichesNonClassees ||
      (options.ficheActionIds && options.ficheActionIds.length > 0) ||
      (options.planActionIds && options.planActionIds.length > 0)
    ) {
      query = sql`${query}
                    LEFT JOIN LATERAL (
          SELECT fa.id
          FROM fiche_action fa
                 JOIN fiche_action_indicateur fai ON fa.id = fai.fiche_id
          WHERE fa.collectivite_id = ${collectiviteId}
            AND fai.indicateur_id = i.id
            ) fa ON true
      `;
    }

    if (options.estConfidentiel || options.estFavorisCollectivite) {
      query = sql`${query}
                    LEFT JOIN indicateur_collectivite c ON i.id = c.indicateur_id AND c.collectivite_id = ${collectiviteId}
      `;
    }
    if (
      options.fichesNonClassees ||
      (options.planActionIds && options.planActionIds.length > 0)
    ) {
      query = sql`${query}
                    LEFT JOIN fiche_action_axe faa ON fa.id = faa.fiche_id
                    LEFT JOIN axe ON faa.axe_id = axe.id
      `;
      if (options.planActionIds && options.planActionIds.length > 0) {
        query = sql`${query}
                      LEFT JOIN axe plan ON axe.plan = plan.id
        `;
      }
    }
    if (options.servicePiloteIds && options.servicePiloteIds.length > 0) {
      query = sql`${query}
                    LEFT JOIN indicateur_service_tag ist ON i.id = ist.indicateur_id
                    LEFT JOIN service_tag st ON ist.service_tag_id = st.id AND st.collectivite_id = ${collectiviteId}`;
    }
    if (options.thematiqueIds && options.thematiqueIds.length > 0) {
      query = sql`${query}
                    LEFT JOIN indicateur_thematique it ON i.id = it.indicateur_id`;
    }
    if (
      (options.utilisateurPiloteIds &&
        options.utilisateurPiloteIds.length > 0) ||
      (options.personnePiloteIds && options.personnePiloteIds.length > 0)
    ) {
      query = sql`${query}
                    LEFT JOIN indicateur_pilote ip ON i.id = ip.indicateur_id AND ip.collectivite_id = ${collectiviteId}`;
    }
    if (options.actionId) {
      query = sql`${query}
                    LEFT JOIN indicateur_action ia ON i.id = ia.indicateur_id
      `;
    }

    const rows = this.databaseService.db.execute(query) as unknown as {
      rows: IndicateurWithDetailsType[];
    };
    return this.groupDetailsIndicateurs(rows.rows, avecEnfant);
  }

  /**
   * Applique l'équivalent d'un group by sur les indicateurs et créé des champs fusionnés entre les parents et enfants pour faciliter les filtres
   * @param indicateurs
   * @param avecEnfant
   */
  private groupDetailsIndicateurs(
    indicateurs: IndicateurWithDetailsType[],
    avecEnfant: boolean
  ) {
    const groupedResults = new Map<
      number,
      {
        id: number;
        identifiantReferentiel: string | null;
        titre: string | null;
        description: string | null;
        collectiviteId: number | null;
        groupementId: number | null;
        participationScore: boolean | null;
        confidentiel?: boolean | null;
        favoris?: boolean | null;
        categorieNoms: Set<string>;
        planIds: Set<number>;
        ficheIds: Set<number>;
        serviceIds: Set<number>;
        thematiqueIds: Set<number>;
        piloteUserIds: Set<string>;
        piloteTagIds: Set<number>;
        parents: Set<number>;
        enfants: Set<number>;
        actionIds: Set<string>;
        participationScoreEnfant: boolean | null;
        confidentielEnfant?: boolean | null;
        favorisEnfant?: boolean | null;
        hasFichesNonClassees: boolean;
        isCompleted: boolean;
        hasOpenData: boolean;
        categorieNomsEnfant: Set<string>;
        planIdsEnfant: Set<number>;
        ficheIdsEnfant: Set<number>;
        serviceIdsEnfant: Set<number>;
        thematiqueIdsEnfant: Set<number>;
        piloteUserIdsEnfant: Set<string>;
        piloteTagIdsEnfant: Set<number>;
        hasFichesNonClasseesEnfant: boolean;
        isCompletedEnfant: boolean;
        hasOpenDataEnfant: boolean;
      }
    >();
    // Parcours le résultat de la requête pour regrouper les tables liés à un même indicateur sous des sets
    indicateurs.forEach((row) => {
      // Récupère l'objet correspondant à l'indicateur en cours ou le créé s'il n'existe pas encore
      let indicateur = groupedResults.get(row.id);
      if (!indicateur) {
        indicateur = {
          id: row.id,
          identifiantReferentiel: row.identifiantReferentiel,
          titre: row.titre,
          description: row.description,
          collectiviteId: row.collectiviteId,
          groupementId: row.groupementId,
          participationScore: row.participationScore,
          confidentiel: row.confidentiel,
          favoris: row.favoris,
          categorieNoms: new Set(),
          planIds: new Set(),
          ficheIds: new Set(),
          serviceIds: new Set(),
          thematiqueIds: new Set(),
          piloteUserIds: new Set(),
          piloteTagIds: new Set(),
          parents: new Set(),
          enfants: new Set(),
          actionIds: new Set(),
          participationScoreEnfant: row.participationScore,
          confidentielEnfant: row.confidentiel,
          favorisEnfant: row.favoris,
          hasFichesNonClassees: false,
          isCompleted: false,
          hasOpenData: false,
          categorieNomsEnfant: new Set(),
          planIdsEnfant: new Set(),
          ficheIdsEnfant: new Set(),
          serviceIdsEnfant: new Set(),
          thematiqueIdsEnfant: new Set(),
          piloteUserIdsEnfant: new Set(),
          piloteTagIdsEnfant: new Set(),
          hasFichesNonClasseesEnfant: false,
          isCompletedEnfant: false,
          hasOpenDataEnfant: false,
        };
        groupedResults.set(row.id, indicateur);
      }

      // Met à jour les différents sets
      if (row.categorieNom) {
        indicateur.categorieNoms.add(row.categorieNom);
        indicateur.categorieNomsEnfant.add(row.categorieNom);
      }
      if (row.planId) {
        indicateur.planIds.add(row.planId);
        indicateur.planIdsEnfant.add(row.planId);
      }
      if (row.ficheId) {
        indicateur.ficheIds.add(row.ficheId);
        indicateur.ficheIdsEnfant.add(row.ficheId);
      }
      if (row.serviceId) {
        indicateur.serviceIds.add(row.serviceId);
        indicateur.serviceIdsEnfant.add(row.serviceId);
      }
      if (row.thematiqueId) {
        indicateur.thematiqueIds.add(row.thematiqueId);
        indicateur.thematiqueIdsEnfant.add(row.thematiqueId);
      }
      if (row.piloteUserId) {
        indicateur.piloteUserIds.add(row.piloteUserId);
        indicateur.piloteUserIdsEnfant.add(row.piloteUserId);
      }
      if (row.piloteTagId) {
        indicateur.piloteTagIds.add(row.piloteTagId);
        indicateur.piloteTagIdsEnfant.add(row.piloteTagId);
      }
      if (row.parent) {
        indicateur.parents.add(row.parent);
      }
      if (row.enfant) {
        indicateur.enfants.add(row.enfant);
      }
      if (row.actionId) {
        indicateur.actionIds.add(row.actionId);
      }
      // Vérifie s'il y a une fiche non classée
      if (row.ficheId && !row.axeId) {
        indicateur.hasFichesNonClassees = true;
        indicateur.hasFichesNonClasseesEnfant = true;
      }

      if (row.valeurId) {
        if (row.metadonneeId) {
          // Vérifie s'il existe des valeurs open data
          indicateur.hasOpenData = true;
          indicateur.hasOpenDataEnfant = true;
        } else {
          // Vérifie s'il existe des valeurs utilisateurs
          indicateur.isCompleted = true;
          indicateur.isCompletedEnfant = true;
        }
      }
    });

    // On groupe les parents avec les enfants si on ne souhaite pas retourner les enfants directement
    if (!avecEnfant) {
      // Parcours les indicateurs pour fusionner les valeurs des sets enfants et parents afin de faciliter les filtres
      groupedResults.forEach((indicateur) => {
        if (indicateur.enfants.size > 0) {
          for (const enfantId of indicateur.enfants) {
            const enfant = groupedResults.get(enfantId);
            if (enfant) {
              indicateur.participationScoreEnfant =
                indicateur.participationScoreEnfant ||
                enfant.participationScore;
              indicateur.confidentielEnfant =
                indicateur.confidentielEnfant || enfant.confidentiel;
              indicateur.favorisEnfant =
                indicateur.favorisEnfant || enfant.favoris;
              indicateur.isCompletedEnfant =
                indicateur.isCompletedEnfant || enfant.isCompleted;
              indicateur.hasOpenDataEnfant =
                indicateur.hasOpenDataEnfant || enfant.hasOpenData;
              indicateur.hasFichesNonClasseesEnfant =
                indicateur.hasFichesNonClasseesEnfant ||
                enfant.hasFichesNonClassees;
              enfant.categorieNoms.forEach(
                indicateur.categorieNomsEnfant.add,
                indicateur.categorieNomsEnfant
              );
              enfant.planIds.forEach(
                indicateur.planIdsEnfant.add,
                indicateur.planIdsEnfant
              );
              enfant.ficheIds.forEach(
                indicateur.ficheIdsEnfant.add,
                indicateur.ficheIdsEnfant
              );
              enfant.serviceIds.forEach(
                indicateur.serviceIdsEnfant.add,
                indicateur.serviceIdsEnfant
              );
              enfant.thematiqueIds.forEach(
                indicateur.thematiqueIdsEnfant.add,
                indicateur.thematiqueIdsEnfant
              );
              enfant.piloteUserIds.forEach(
                indicateur.piloteUserIdsEnfant.add,
                indicateur.piloteUserIdsEnfant
              );
              enfant.piloteTagIds.forEach(
                indicateur.piloteTagIdsEnfant.add,
                indicateur.piloteTagIdsEnfant
              );
            }
          }
        }
      });
    }

    // Transforme la map et les sets en tableau pour faciliter leur lecture
    return Array.from(groupedResults.values()).map((item) => ({
      ...item,
      categorieNoms: Array.from(item.categorieNoms),
      planIds: Array.from(item.planIds),
      ficheIds: Array.from(item.ficheIds),
      serviceIds: Array.from(item.serviceIds),
      thematiqueIds: Array.from(item.thematiqueIds),
      piloteUserIds: Array.from(item.piloteUserIds),
      piloteTagIds: Array.from(item.piloteTagIds),
      parents: Array.from(item.parents),
      enfants: Array.from(item.enfants),
      actionIds: Array.from(item.actionIds),
      categorieNomsEnfant: Array.from(item.categorieNomsEnfant),
      planIdsEnfant: Array.from(item.planIdsEnfant),
      ficheIdsEnfant: Array.from(item.ficheIdsEnfant),
      serviceIdsEnfant: Array.from(item.serviceIdsEnfant),
      thematiqueIdsEnfant: Array.from(item.thematiqueIdsEnfant),
      piloteUserIdsEnfant: Array.from(item.piloteUserIdsEnfant),
      piloteTagIdsEnfant: Array.from(item.piloteTagIdsEnfant),
    }));
  }

  /**
   * Retourne vrai si au moins un élément est commun dans les deux tableaux
   * @param array1
   * @param array2
   */
  private hasCommunElement(array1: any[], array2: any[]): boolean {
    const set1 = new Set(array1);
    return array2.some((element) => set1.has(element));
  }

  /**
   * Normalise une chaîne de caractère
   * @param str
   */
  private normalizeString(str: string): string {
    return str
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .toLowerCase() // Met tout en minuscules
      .trim() // Supprime les espaces en début et en fin
      .replace(/\s+/g, ' '); // Remplace les espaces multiples par un seul espace
  }
}
