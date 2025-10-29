import { ScoreFinal } from '@/backend/referentiels/compute-score/score.dto';
import { StatutAvancementEnum } from '@/backend/referentiels/models/action-statut.table';
import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import {
  findActionById,
  getParentIdFromActionId,
  getScoreRatios,
} from '@/backend/referentiels/referentiels.utils';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, getTableColumns, lte, sql } from 'drizzle-orm';
import { ObjectToSnake, objectToSnake } from 'ts-case-convert';
import { ScoresPayload } from '../snapshots/scores-payload.dto';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { Audit } from './audit.table';
import { cotTable } from './cot.table';
import {
  EtoileActionConditionDefinition,
  etoileActionConditionDefinitionTable,
} from './etoile-action-condition-definition.table';
import {
  Etoile,
  etoileDefinitionTable,
  EtoileEnum,
} from './etoile-definition.table';
import { LabellisationDemande } from './labellisation-demande.table';
import { LabellisationService } from './labellisation.service';
import { Labellisation, labellisationTable } from './labellisation.table';
import { TCritereScore } from './labellisations.types';

type ConditionFichiers = { atteint: boolean };

type TLabellisationAndDemandeAndAudit = {
  labellisation: ObjectToSnake<
    Labellisation & { prochaine_etoile: Etoile | null }
  > | null;
  audit: ObjectToSnake<Audit> | null;
  demande: ObjectToSnake<LabellisationDemande> | null;
  isCot: boolean;
  conditionFichiers: ConditionFichiers;
};

type ParcoursLabellisation = {
  etoiles: Etoile;
  completude_ok: boolean;
  critere_score: TCritereScore;
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
  audit: ObjectToSnake<Audit> | null;
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

  async getLabellisationAndDemandeAndAudit({
    collectiviteId,
    referentielId,
    user,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
    user: AuthUser;
  }): Promise<TLabellisationAndDemandeAndAudit> {
    // const lastObtainedLabellisation = this.db
    //   .select()
    //   .from(labellisationTable)
    //   .where(
    //     and(
    //       eq(labellisationTable.collectiviteId, collectiviteId),
    //       eq(labellisationTable.referentiel, referentielId)
    //     )
    //   )
    //   .orderBy(desc(labellisationTable.obtenueLe))
    //   .limit(1);

    const currentLabellisationQuery = this.getCurrentLabellisationQuery({
      collectiviteId,
      referentielId,
    });

    // const currentAudit = this.db
    //   .select()
    //   .from(auditTable)
    //   .where(
    //     and(
    //       eq(auditTable.collectiviteId, collectiviteId),
    //       eq(auditTable.referentiel, referentielId),
    //       not(auditTable.clos)
    //     )
    //   )
    //   .limit(1);

    // Remove this type when old view `current_audit()` is removed
    // type TAudit = {
    //   clos: boolean;
    //   collectivite_id: number;
    //   date_cnl: string | null;
    //   date_debut: string | null;
    //   date_fin: string | null;
    //   demande_id: number | null;
    //   id: number;
    //   referentiel: ReferentielId;
    //   valide: boolean;
    //   valide_labellisation: boolean | null;
    // };

    const currentAudit = this.db.select({
      id: sql`a.id`,
      collectivite_id: sql`a.collectivite_id`,
      referentiel: sql`a.referentiel`,
      demande_id: sql`a.demande_id`,
      date_debut: sql`a.date_debut`,
      date_fin: sql`a.date_fin`,
      valide: sql`a.valide`,
    })
      .from(sql`labellisation.current_audit(${collectiviteId}, ${referentielId}) a
    (id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide, date_cnl, valide_labellisation, clos)`);

    const demande = this.db
      .select({
        id: sql<number>`d.id`,
        en_cours: sql`d.en_cours`,
        collectivite_id: sql`d.collectivite_id`,
        referentiel: sql`d.referentiel`,
        etoiles: sql`d.etoiles`,
        date: sql`d.date`,
        sujet: sql`d.sujet`,
      })
      .from(
        sql`labellisation_demande(${collectiviteId}, ${referentielId}) d
    (id, en_cours, collectivite_id, referentiel, etoiles, date, sujet, modified_at, envoyee_le, demandeur)`
      );

    const conditionFichiers = this.db
      .select({
        referentiel: sql`cf.referentiel`,
        preuve_nombre: sql`cf.preuve_nombre`,
        atteint: sql`cf.atteint`,
      })
      .from(
        sql`labellisation.critere_fichier(${collectiviteId}) cf(referentiel, preuve_nombre, atteint)`
      )
      .where(eq(sql`cf.referentiel`, referentielId));

    return this.databaseService
      .rls(user)(async (tx) => {
        return tx
          .with(
            tx.$with('labellisation').as(currentLabellisationQuery),
            tx.$with('audit').as(currentAudit),
            tx.$with('demande').as(demande),
            tx.$with('cf').as(conditionFichiers)
          )
          .select({
            labellisation: sql<ObjectToSnake<
              Labellisation & { prochaine_etoile: Etoile | null }
            > | null>`to_jsonb(labellisation.*)`,
            audit: sql<ObjectToSnake<Audit> | null>`to_jsonb(audit.*)`,
            demande: sql<ObjectToSnake<LabellisationDemande> | null>`to_jsonb(demande.*)`,
            isCot: sql<boolean>`${cotTable.collectiviteId} IS NOT NULL`.as(
              'isCot'
            ),
            conditionFichiers: sql<{ atteint: boolean }>`to_jsonb(cf.*)`,
          })
          .from(currentLabellisationQuery.as('labellisation'))
          .fullJoin(currentAudit.as('audit') as any, sql`true`)
          .fullJoin(demande.as('demande') as any, sql`true`)
          .fullJoin(conditionFichiers.as('cf'), sql`true`)
          .leftJoin(cotTable, eq(cotTable.collectiviteId, collectiviteId))
          .limit(1);
      })
      .then((rows) => rows[0]);
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

  private getCurrentLabellisationQuery({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }) {
    const query = this.db
      .select({
        // currentEtoile: labellisationTable.etoiles,
        // nextEtoile: etoileDefinitionTable.prochaineEtoile,
        // annee: labellisationTable.annee,
        // obtenuLe: labellisationTable.obtenueLe,
        // scoreFait: labellisationTable.scoreRealise,
        // scoreProgramme: labellisationTable.scoreProgramme,

        collectivite_id: labellisationTable.collectiviteId,
        referentiel: labellisationTable.referentiel,
        obtenu_le: labellisationTable.obtenueLe,
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
      .limit(1);
    // .then((rows) => (rows.length ? rows[0] : null));

    return query;
  }

  async getParcoursLabellisation({
    collectiviteId,
    referentielId,
    user,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
    user: AuthUser;
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
        user,
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
  A extends { actionId: string; actionsEnfant?: A[]; score: ScoreFinal }
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
