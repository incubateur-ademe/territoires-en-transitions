import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  ActionScoreFinal,
  Etoile,
  EtoileEnum,
  findActionById,
  getParentIdFromActionId,
  getScoreRatios,
  Labellisation,
  LabellisationAudit,
  LabellisationCritere,
  LabellisationDemande,
  ReferentielId,
  ScoresPayload,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { and, desc, eq, getTableColumns, lte, not, sql } from 'drizzle-orm';
import { ObjectToSnake, objectToSnake } from 'ts-case-convert';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { auditTable } from './audit.table';
import { cotTable } from './cot.table';
import {
  EtoileActionConditionDefinition,
  etoileActionConditionDefinitionTable,
} from './etoile-action-condition-definition.table';
import { etoileDefinitionTable } from './etoile-definition.table';
import { labellisationDemandeTable } from './labellisation-demande.table';
import { LabellisationService } from './labellisation.service';
import { labellisationTable } from './labellisation.table';

type ConditionFichiers = { atteint: boolean };

type TLabellisationAndDemandeAndAudit = {
  labellisation: ObjectToSnake<
    Labellisation & { prochaine_etoile: Etoile | null }
  > | null;
  audit: ObjectToSnake<LabellisationAudit> | null;
  demande: ObjectToSnake<LabellisationDemande> | null;
  isCot: boolean;
  conditionFichiers: ConditionFichiers;
};

type ParcoursLabellisation = {
  etoiles: Etoile;
  completude_ok: boolean;
  critere_score: LabellisationCritere;
  criteres_action: ObjectToSnake<
    Omit<
      EtoileActionConditionDefinition,
      'minRealiseScore' | 'minProgrammeScore'
    > & {
      atteint: boolean;
      rempli: boolean;
      proportionFait: number;
      proportionProgramme: number;
      statut_ou_score: string;
    }
  >[];

  rempli: boolean;
  labellisation:
    | (ObjectToSnake<Labellisation> & { prochaine_etoile: Etoile | null })
    | null;
  demande: ObjectToSnake<LabellisationDemande> | null;
  audit: ObjectToSnake<LabellisationAudit> | null;
  isCot: boolean;
  conditionFichiers: ConditionFichiers;
  score: ScoresPayload['scores']['score'];
};

@Injectable()
export class GetLabellisationService {
  private readonly logger = new Logger(GetLabellisationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly snapshotsService: SnapshotsService,
    private readonly labellisationService: LabellisationService
  ) {}

  private readonly db = this.databaseService.db;

  async listActionConditionDefinitions({
    referentielId,
    etoileCible,
  }: {
    referentielId: ReferentielId;
    etoileCible: Etoile;
  }): Promise<
    Omit<
      EtoileActionConditionDefinition,
      'minRealiseScore' | 'minProgrammeScore'
    >[]
  > {
    // Pour une même `actionId`, il peut exister plusieurs conditions, chacune liée à un nombre d'étoiles différentes.
    // Or, pour chaque `actionId`, on veut uniquement la condition liée à la plus grande étoile
    // (et se trouvant par ailleurs inférieure ou égale à `etoileCible`)
    const listWithMaxEtoileByActionId = this.db
      .select({
        ...getTableColumns(etoileActionConditionDefinitionTable),
        maxEtoile:
          sql`MAX(${etoileActionConditionDefinitionTable.etoile}::varchar::integer)
            OVER (PARTITION BY ${etoileActionConditionDefinitionTable.actionId})`.as<Etoile>(
            'maxEtoile'
          ),
      })
      .from(etoileActionConditionDefinitionTable)
      .where(
        and(
          eq(etoileActionConditionDefinitionTable.referentielId, referentielId),
          lte(
            sql`${etoileActionConditionDefinitionTable.etoile}::varchar::integer`,
            etoileCible
          )
        )
      );

    const subQuery = this.db
      .$with('ranked_conditions')
      .as(listWithMaxEtoileByActionId);

    const query = this.db
      .with(subQuery)
      .select({
        etoile: subQuery.etoile,
        priorite: subQuery.priorite,
        referentielId: subQuery.referentielId,
        actionId: subQuery.actionId,
        formulation: subQuery.formulation,
        minRealisePercentage: subQuery.minRealisePercentage,
        minProgrammePercentage: subQuery.minProgrammePercentage,
      })
      .from(subQuery)
      .where(eq(sql`${subQuery.etoile}::varchar::integer`, subQuery.maxEtoile));

    return await query;
  }

  /**
   * A bit weird to automatically create an empty audit / demande if not exists
   * But for retrocompatibility with current behavior.
   * This function just aims to replace functions labellisation.current_audit and labellisation.current_demande
   * TODO: change this behavior in the future and change case
   */
  async getOrCreateCurrentAuditAndDemande(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<{
    audit: ObjectToSnake<LabellisationAudit>;
    demande: ObjectToSnake<LabellisationDemande>;
  }> {
    return this.db.transaction(async (tx) => {
      // Function labellisation.current_audit
      let currentAudit: LabellisationAudit;
      const currentAuditResult = await tx
        .select()
        .from(auditTable)
        .where(
          and(
            eq(auditTable.collectiviteId, collectiviteId),
            eq(auditTable.referentielId, referentielId),
            not(auditTable.clos)
          )
        )
        .limit(1);
      if (currentAuditResult.length) {
        currentAudit = currentAuditResult[0];
      } else {
        currentAudit = await tx
          .insert(auditTable)
          .values({ collectiviteId, referentielId })
          .returning()
          .then((rows) => rows[0]);
      }
      if (!currentAudit) {
        throw new InternalServerErrorException(`Audit non trouvé`);
      }

      // Function labellisation.current_demande
      let currentDemande: LabellisationDemande | null = null;
      if (currentAudit.demandeId) {
        currentDemande = await tx
          .select()
          .from(labellisationDemandeTable)
          .where(eq(labellisationDemandeTable.id, currentAudit.demandeId))
          .limit(1)
          .then((rows) => rows[0]);
        if (!currentDemande) {
          throw new InternalServerErrorException(
            `Demande ${currentAudit.demandeId} non trouvée`
          );
        }
      } else {
        currentDemande = await tx
          .insert(labellisationDemandeTable)
          .values({ collectiviteId, referentiel: referentielId })
          .returning()
          .then((rows) => rows[0]);

        if (!currentDemande) {
          throw new InternalServerErrorException(
            `Impossible de créer la demande`
          );
        }

        await tx
          .update(auditTable)
          .set({ demandeId: currentDemande.id })
          .where(eq(auditTable.id, currentAudit.id));
        currentAudit.demandeId = currentDemande.id;
      }

      // Mapping for legacy reasons,
      // TODO: to be removed when the frontend is updated
      return {
        audit: {
          collectivite_id: currentAudit.collectiviteId,
          date_cnl: currentAudit.dateCnl,
          date_debut: currentAudit.dateDebut,
          date_fin: currentAudit.dateFin,
          demande_id: currentAudit.demandeId,
          id: currentAudit.id,
          referentiel_id: currentAudit.referentielId,
          valide: currentAudit.valide,
          valide_labellisation: currentAudit.valideLabellisation,
          clos: currentAudit.clos,
        },
        demande: {
          collectivite_id: currentDemande.collectiviteId,
          date: currentDemande.date,
          demandeur: currentDemande.demandeur,
          en_cours: currentDemande.enCours,
          envoyee_le: currentDemande.envoyeeLe,
          etoiles: currentDemande.etoiles as '1' | '2' | '3' | '4' | '5' | null,
          modified_at: currentDemande.modifiedAt,
          id: currentDemande.id,
          referentiel: currentDemande.referentiel,
          sujet: currentDemande.sujet,
          associated_collectivite_id: currentDemande.associatedCollectiviteId,
        },
      };
    });
  }

  async isCot(collectiviteId: number) {
    const cotResult = await this.db
      .select()
      .from(cotTable)
      .where(eq(cotTable.collectiviteId, collectiviteId))
      .limit(1);
    // CUrrent implementation,
    // TODO: is that normal that we don't check if the cot is active?
    return cotResult.length > 0;
  }

  async getConditionFichiers(demandeId: number) {
    return this.db
      .select({
        referentiel: labellisationDemandeTable.referentiel,
        preuve_nombre: sql<number>`count(${preuveLabellisationTable.fichierId})`,
        atteint: sql<boolean>`count(${preuveLabellisationTable.fichierId}) > 0`,
      })
      .from(preuveLabellisationTable)
      .leftJoin(
        labellisationDemandeTable,
        eq(preuveLabellisationTable.demandeId, labellisationDemandeTable.id)
      )
      .where(and(eq(preuveLabellisationTable.demandeId, demandeId)))
      .groupBy(labellisationDemandeTable.referentiel)
      .limit(1)
      .then((rows) => (rows.length ? rows[0] : null));
  }

  async getLabellisationAndDemandeAndAudit({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }): Promise<TLabellisationAndDemandeAndAudit> {
    const isCot = await this.isCot(collectiviteId);
    const currentLabellisation = await this.getCurrentLabellisation({
      collectiviteId,
      referentielId,
    });

    const { audit, demande } = await this.getOrCreateCurrentAuditAndDemande(
      collectiviteId,
      referentielId
    );

    const conditionFichiers = await this.getConditionFichiers(demande.id);

    return {
      audit,
      demande,
      labellisation: currentLabellisation,
      conditionFichiers: conditionFichiers ?? {
        referentiel: referentielId,
        preuve_nombre: 0,
        atteint: false,
      },
      isCot,
    };
  }

  getScorePgFunction({ collectiviteId }: { collectiviteId: number }) {
    const statement = sql`with
      ref as (select unnest(enum_range(null::referentiel)) as referentiel),

      -- Score JSON en format table SQL
      scores as (
        select s.*
        from ref
        left join client_scores cs on cs.referentiel = ref.referentiel
        join private.convert_client_scores(cs.scores) s on true
        where cs.collectivite_id = ${collectiviteId}
      )

      select s.referentiel,
        ss.proportion_fait,
        ss.proportion_programme,
        ss.completude,
        ss.complete
      from scores s
      join private.score_summary_of(s) ss on true
      where s.action_id = s.referentiel::action_id
    `;

    return this.db.execute(statement);
  }

  /**
   * Équivalent de la fonction PG `labellisation.referentiel_score`, basée sur `client_scores`,
   * et utilisant elle-même les fonctions PG :
   * - `private.convert_client_scores`
   * - `private.score_summary_of`
   */
  async getScoresOverview({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }) {
    const snapshot = await this.snapshotsService.get(
      collectiviteId,
      referentielId
    );

    // const snapshot = await this.scoresService.computeScoreForCollectivite(
    //   ReferentielIdEnum.CAE,
    //   collectiviteId,
    //   { mode: ComputeScoreMode.DEPUIS_SAUVEGARDE }
    // );

    const { score } = snapshot.scoresPayload.scores;
    const ratios = getScoreRatios(score);

    return {
      isCompleted: score.completedTachesCount === score.totalTachesCount,
      completude: ratios.ratioTachesCount,
      proportion_fait: ratios.ratioFait,
      proportion_programme: ratios.ratioProgramme,
      referentiel: 'cae',
    };
  }

  /**
   * Récupère les étoiles pour tous les référentiels.
   */
  getEtoilesPgFunction({ collectiviteId }: { collectiviteId: number }) {
    const statement = sql`with
      ref as (select unnest(enum_range(null::referentiel)) as referentiel),

    -- étoile déduite de la labellisation obtenue
     l_etoile as (select r.referentiel,
                         em.etoile,
                         em.prochaine_etoile
                  from ref r
                           join public.labellisation l on r.referentiel = l.referentiel
                           join labellisation.etoile_meta em
                                on em.etoile = l.etoiles::varchar::labellisation.etoile
                  where l.collectivite_id = ${collectiviteId}
                  order by l.obtenue_le desc
                  limit 1),

     score as (select * from labellisation.referentiel_score(${collectiviteId})),

     -- étoile déduite du score
     s_etoile as (select r.referentiel,
                         case
                             when s.complet then max(em.etoile)
                             end as etoile_atteinte
                  from ref r
                           join score s on r.referentiel = s.referentiel
                           join labellisation.etoile_meta em
                                on em.min_realise_score <= s.score_fait
                  group by r.referentiel, s.complet)

select s.referentiel,
       l.etoile                                                       as etoile_labellise,
       l.prochaine_etoile                                             as prochaine_etoile_labellisation,
       s.etoile_atteinte                                              as etoile_score_possible,
       greatest(l.etoile, l.prochaine_etoile, s.etoile_atteinte, '1') as etoile_objectif
from s_etoile s
         left join l_etoile l on l.referentiel = s.referentiel`;

    return this.db.execute(statement);
  }

  async getCurrentLabellisation({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }): Promise<
    (ObjectToSnake<Labellisation> & { prochaine_etoile: Etoile | null }) | null
  > {
    return this.db
      .select({
        id: labellisationTable.id,
        collectivite_id: labellisationTable.collectiviteId,
        referentiel: labellisationTable.referentiel,
        obtenue_le: labellisationTable.obtenueLe,
        annee: labellisationTable.annee,
        etoiles: labellisationTable.etoiles,
        score_realise: labellisationTable.scoreRealise,
        score_programme: labellisationTable.scoreProgramme,

        prochaine_etoile: etoileDefinitionTable.prochaineEtoile,
      })
      .from(labellisationTable)
      .innerJoin(
        etoileDefinitionTable,
        eq(
          // D'un côté en enum PG (varchar), de l'autre en integer, donc on compare en castant en varchar.
          // À supprimer quand `etoileDefinitionTable.etoile` aura été migré en integer.
          sql`${labellisationTable.etoiles}::varchar`,
          sql`${etoileDefinitionTable.etoile}::varchar`
        )
      )
      .where(
        and(
          eq(labellisationTable.collectiviteId, collectiviteId),
          // Cast à supprimer quand `referentielId` aura été migré en varchar FK vers `referentiel_definition.id`
          // plutôt que en enum PG.
          eq(sql`${labellisationTable.referentiel}::varchar`, referentielId)
        )
      )
      .orderBy(desc(labellisationTable.obtenueLe))
      .limit(1)
      .then((rows) => (rows.length ? rows[0] : null));
  }

  async getParcoursLabellisation({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }): Promise<ParcoursLabellisation> {
    const snapshot = await this.snapshotsService.get(
      collectiviteId,
      referentielId
    );

    // const snapshot = await this.scoresService.computeScoreForCollectivite(
    //   ReferentielIdEnum.CAE,
    //   collectiviteId,
    //   { mode: ComputeScoreMode.DEPUIS_SAUVEGARDE }
    // );

    const { score } = snapshot.scoresPayload.scores;

    const scoreRatios = getScoreRatios(score);

    const scoresOverview = {
      isCompleted: score.completedTachesCount === score.totalTachesCount,
      // completude: scoreRatios.ratioTachesCount,
      // proportion_fait: scoreRatios.ratioFait,
      // proportion_programme: scoreRatios.ratioProgramme,
      // referentiel: 'cae',
    };

    const { labellisation, demande, audit, isCot, conditionFichiers } =
      await this.getLabellisationAndDemandeAndAudit({
        collectiviteId,
        referentielId,
      });

    const etoileCible = await this.getEtoileCible({
      currentEtoile: labellisation?.etoiles,
      nextEtoile: labellisation?.prochaine_etoile ?? undefined,
      scoreFait: scoreRatios?.ratioFait,
    });

    const actionConditionDefinitions =
      await this.listActionConditionDefinitions({
        referentielId,
        etoileCible: etoileCible.etoile,
      });

    const criteresAction = actionConditionDefinitions
      .map(addIsScoreConditionSatisfied(snapshot.scoresPayload.scores))
      .filter((c) => c !== null);

    // Équivalent de la fonction PG `labellisation.critere_score_global()`, basée sur `client_scores`.
    const critereScore = {
      score_a_realiser: etoileCible.minRealiseScore,
      score_fait: scoreRatios.ratioFait,
      atteint: scoreRatios.ratioFait >= etoileCible.minRealiseScore,
      etoiles: etoileCible.etoile,
    };

    return {
      etoiles: etoileCible.etoile,
      completude_ok: scoresOverview.isCompleted,

      critere_score: critereScore,
      criteres_action: criteresAction.map(objectToSnake),

      rempli:
        critereScore.atteint &&
        criteresAction.every((c) => c.atteint) &&
        (isCot ? true : conditionFichiers.atteint),

      labellisation,
      demande,
      audit,

      score,

      isCot,
      conditionFichiers,
    };
  }

  private async getEtoileCible({
    currentEtoile = EtoileEnum.PREMIERE_ETOILE,
    nextEtoile = EtoileEnum.PREMIERE_ETOILE,
    scoreFait,
  }: {
    currentEtoile: number | undefined;
    nextEtoile: number | undefined;
    scoreFait: number | null | undefined;
  }) {
    const etoilesDefinitions =
      await this.labellisationService.getEtoileDefinitions();

    // Etoiles are sorted from 5 to 1
    const maxEligibleEtoile = scoreFait
      ? // Find the last item where minRealiseScore < scoreFait
        etoilesDefinitions.find((etoile) => etoile.minRealiseScore <= scoreFait)
          ?.etoile ?? EtoileEnum.PREMIERE_ETOILE
      : EtoileEnum.PREMIERE_ETOILE;

    const nbEtoilesCibles = Math.max(
      currentEtoile,
      nextEtoile,
      maxEligibleEtoile,
      EtoileEnum.PREMIERE_ETOILE
    ) as Etoile;

    // const etoiles = {
    //   etoile_labellise: labellisation.currentEtoile,
    //   prochaine_etoile_labellisation: labellisation.nextEtoile,
    //   etoile_score_possible: maxEligibleEtoile,
    //   etoile_objectif: nbEtoilesCibles,
    // };

    const etoileCible = etoilesDefinitions.find(
      (etoile) => etoile.etoile === nbEtoilesCibles
    );

    if (!etoileCible) {
      throw new Error(`Étoile cible ${nbEtoilesCibles} introuvable`);
    }

    return etoileCible;
  }
}

/**
 * Équivalent de la fonction PG `labellisation.critere_action()`, basée sur `client_scores`.
 */
function addIsScoreConditionSatisfied<
  A extends { actionId: string; actionsEnfant: A[]; score: ActionScoreFinal }
>(actionScoresTree: A) {
  return (
    actionCondition: Awaited<
      ReturnType<GetLabellisationService['listActionConditionDefinitions']>
    >[number]
  ) => {
    const action = findActionById(actionScoresTree, actionCondition.actionId);

    const actionScore = {
      ...action.score,
      ...getScoreRatios(action.score),
    };

    // Automatique non concerné (par la personnalisation) > ne doit pas être affiché
    if (action.score.desactive) {
      return null;
    }

    const actionSatisfyRatioFait =
      actionScore.ratioFait * 100 >= actionCondition.minRealisePercentage;

    const actionSatisfyRatioFaitPlusProgramme =
      actionCondition.minProgrammePercentage !== null &&
      (actionScore.ratioFait + actionScore.ratioProgramme) * 100 >=
        actionCondition.minProgrammePercentage;

    const parent = findActionById(
      actionScoresTree,
      getParentIdFromActionId(actionCondition.actionId) as string
    );

    const parentScore = {
      ...parent.score,
      ...getScoreRatios(parent.score),
    };

    const parentSatisfyRatioFait =
      parentScore.ratioFait * 100 >= actionCondition.minRealisePercentage;

    const parentSatisfyRatioFaitPlusProgramme =
      actionCondition.minProgrammePercentage !== null &&
      (parentScore.ratioFait + parentScore.ratioProgramme) * 100 >=
        actionCondition.minProgrammePercentage;

    const isConditionSatisfied =
      parent.score.concerne &&
      parent.score.avancement &&
      parent.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
        ? parentSatisfyRatioFait || parentSatisfyRatioFaitPlusProgramme
        : actionSatisfyRatioFait || actionSatisfyRatioFaitPlusProgramme;

    let statutOrScore;

    if (
      actionCondition.minRealisePercentage === 100 &&
      actionCondition.minProgrammePercentage === null
    ) {
      statutOrScore = 'Fait';
    } else if (
      actionCondition.minRealisePercentage === 100 &&
      actionCondition.minProgrammePercentage === 100
    ) {
      statutOrScore = 'Programmé ou fait';
    } else if (
      actionCondition.minRealisePercentage !== null &&
      actionCondition.minProgrammePercentage === null
    ) {
      statutOrScore = `${actionCondition.minRealisePercentage}% fait minimum`;
    } else {
      statutOrScore = `${actionCondition.minRealisePercentage}% fait minimum ou ${actionCondition.minProgrammePercentage}% programmé minimum`;
    }

    return {
      ...actionCondition,
      atteint: isConditionSatisfied,
      rempli: isConditionSatisfied,
      proportionFait: actionScore.ratioFait,
      proportionProgramme: actionScore.ratioProgramme,
      statut_ou_score: statutOrScore,
    };
  };
}
