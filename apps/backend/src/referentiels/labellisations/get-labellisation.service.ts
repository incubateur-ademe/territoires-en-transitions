import { preuveLabellisationTable } from '@/backend/collectivites/documents/models/preuve-labellisation.table';
import { ScoreFinal } from '@/backend/referentiels/compute-score/score.dto';
import { StatutAvancementEnum } from '@/backend/referentiels/models/action-statut.table';
import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import {
  findActionById,
  getParentIdFromActionId,
  getScoreRatios,
} from '@/backend/referentiels/referentiels.utils';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { and, desc, eq, getTableColumns, lte, not, sql } from 'drizzle-orm';
import { objectToSnake } from 'ts-case-convert';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { Audit, auditTable } from './audit.table';
import { cotTable } from './cot.table';
import { etoileActionConditionDefinitionTable } from './etoile-action-condition-definition.table';
import {
  Etoile,
  etoileDefinitionTable,
  EtoileEnum,
} from './etoile-definition.table';
import {
  LabellisationDemande,
  labellisationDemandeTable,
  SujetDemande,
} from './labellisation-demande.table';
import { LabellisationService } from './labellisation.service';
import { labellisationTable } from './labellisation.table';

type TAudit = {
  clos: boolean;
  collectivite_id: number;
  date_cnl: string | null;
  date_debut: string | null;
  date_fin: string | null;
  demande_id: number | null;
  id: number;
  referentiel: ReferentielId;
  valide: boolean;
  valide_labellisation: boolean | null;
};

type TDemande = {
  collectivite_id: number;
  date: string;
  demandeur: string | null;
  en_cours: boolean;
  envoyee_le: string | null;
  etoiles: '1' | '2' | '3' | '4' | '5' | null;
  id: number;
  modified_at: string | null;
  referentiel: ReferentielId;
  sujet: SujetDemande | null;
};

type TLabellisation = {
  annee: number | null;
  collectivite_id: number | null;
  etoiles: number;
  id: number;
  obtenue_le: string;
  referentiel: ReferentielId;
  score_programme: number | null;
  score_realise: number | null;

  prochaine_etoile: number | null;
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
  }) {
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
        prio: subQuery.priorite,
        referentiel: subQuery.referentielId,
        actionId: subQuery.actionId,
        formulation: subQuery.formulation,
        minRealisePercentage: subQuery.minRealisePercentage,
        minProgrammePercentage: subQuery.minProgrammePercentage,
      })
      .from(subQuery)
      .where(eq(sql`${subQuery.etoile}::varchar::integer`, subQuery.maxEtoile));

    return query;
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
  ): Promise<{ audit: TAudit; demande: TDemande }> {
    return this.db.transaction(async (tx) => {
      // Function labellisation.current_audit
      let currentAudit: Audit;
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

      return {
        audit: {
          collectivite_id: currentAudit.collectiviteId,
          date_cnl: currentAudit.dateCnl,
          date_debut: currentAudit.dateDebut,
          date_fin: currentAudit.dateFin,
          demande_id: currentAudit.demandeId,
          id: currentAudit.id,
          referentiel: currentAudit.referentielId,
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
    user,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
    user: AuthUser;
  }): Promise<{
    audit: TAudit;
    demande: TDemande;
    labellisation: TLabellisation | null;
    conditionFichiers: {
      preuve_nombre: number;
      atteint: boolean;
      referentiel: ReferentielId | null;
    };
    isCot: boolean;
  }> {
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
  }): Promise<TLabellisation | null> {
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

  async getCurrentCritere({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }) {
    const statement = sql`SELECT
    c.referentiel,
    c.etoiles,
    c.action_id,
    c.formulation,
    c.score_realise,
    c.min_score_realise,
    c.score_programme,
    c.min_score_programme,
    c.atteint,
    c.prio
    FROM (labellisation.critere_action(${collectiviteId}) c(referentiel, etoiles, action_id, formulation, score_realise, min_score_realise, score_programme, min_score_programme, atteint, prio)
    JOIN etoiles e_1 ON (((e_1.referentiel = c.referentiel) AND (e_1.etoile_objectif >= c.etoiles))))
    WHERE (((c.etoiles)::text)::integer = ( SELECT ((max(lac.etoile))::text)::integer AS max
    FROM labellisation_action_critere lac
    WHERE ((((e_1.etoile_objectif)::text)::integer >= ((lac.etoile)::text)::integer) AND ((c.action_id)::text = (lac.action_id)::text))
    GROUP BY lac.action_id))`;

    return this.db.execute(statement);
  }

  async critereScoreGlobalPgFunction({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }) {
    const statement = sql`with score as (select * from labellisation.referentiel_score(${collectiviteId}))
select e.referentiel,
       e.etoile_objectif,
       em.min_realise_score,
       s.score_fait,
       s.score_fait >= em.min_realise_score as atteint
from labellisation.etoiles(${collectiviteId}) as e
         left join labellisation.etoile_meta em on em.etoile = e.etoile_objectif
         left join score s on e.referentiel = s.referentiel`;

    return this.db.execute(statement);
  }

  async critereActionPgFunction({
    collectiviteId,
    etoileObjectif,
  }: {
    collectiviteId: number;
    etoileObjectif: number;
  }) {
    const statement = sql`
    WITH current_critere AS (
          SELECT c.referentiel,
             c.etoiles,
             c.action_id,
             c.formulation,
             c.score_realise,
             c.min_score_realise,
             c.score_programme,
             c.min_score_programme,
             c.atteint,
             c.prio
            FROM labellisation.critere_action(${collectiviteId}) c(referentiel, etoiles, action_id, formulation, score_realise, min_score_realise, score_programme, min_score_programme, atteint, prio)
            -- JOIN etoiles e_1 ON (((e_1.referentiel = c.referentiel) AND (${etoileObjectif} >= c.etoiles))))
            WHERE (((c.etoiles)::text)::integer = (
              SELECT ((max(lac.etoile))::text)::integer AS max
              FROM labellisation_action_critere lac
              WHERE ${etoileObjectif} >= lac.etoile::text::integer AND c.action_id::text = lac.action_id::text
              GROUP BY lac.action_id
            )
         )

    SELECT
      ral.referentiel,
      ral.atteints,
      ral.liste
    FROM (
      SELECT
        c.referentiel,
        bool_and(c.atteint) AS atteints,
        jsonb_agg(jsonb_build_object('formulation', c.formulation, 'prio', c.prio, 'action_id', c.action_id, 'rempli', c.atteint, 'etoile', c.etoiles, 'action_identifiant', ad.identifiant, 'statut_ou_score',
        CASE
            WHEN ((c.min_score_realise = (100)::double precision) AND (c.min_score_programme IS NULL)) THEN 'Fait'::text
            WHEN ((c.min_score_realise = (100)::double precision) AND (c.min_score_programme = (100)::double precision)) THEN 'Programmé ou fait'::text
            WHEN ((c.min_score_realise IS NOT NULL) AND (c.min_score_programme IS NULL)) THEN (c.min_score_realise || '% fait minimum'::text)
            ELSE (((c.min_score_realise || '% fait minimum ou '::text) || c.min_score_programme) || '% programmé minimum'::text)
        END)) AS liste
      FROM (current_critere c
      JOIN action_definition ad ON (((c.action_id)::text = (ad.action_id)::text)))
      GROUP BY c.referentiel
    ) ral`;

    const statement2 = sql`
    with scores as (
                select s.*
                from client_scores cs
                join private.convert_client_scores(cs.scores) s on true
                where cs.collectivite_id = ${collectiviteId}
    )

    select ss.referentiel,
       cla.etoile,
       cla.action_id,
       cla.formulation,
       ss.proportion_fait,
       cla.min_realise_percentage,
       ss.proportion_programme,
       cla.min_programme_percentage,
       (select s.avancement
                          from action_statut s
                          where s.action_id = sa.action_id
                            and s.collectivite_id = ${collectiviteId}
                            and s.avancement != 'non_renseigne'
                            and s.concerne) as sa_avancement,
       case
           -- l'action a une sous-action parente sa, qui a un statut exists
           when sa is not null
               and exists(select *
                          from action_statut s
                          where s.action_id = sa.action_id
                            and s.collectivite_id = ${collectiviteId}
                            and s.avancement != 'non_renseigne'
                            and s.concerne)
               then
                   coalesce(sass.proportion_fait * 100 >= cla.min_realise_percentage, false)
                   or coalesce((sass.proportion_programme + sass.proportion_fait) * 100 >= cla.min_programme_percentage, false)
           -- sinon
           else
                  -- le score fait est >= au critère fait
                   coalesce(ss.proportion_fait * 100 >= cla.min_realise_percentage, false)
                   -- le score fait + programme est >= au critère programme
                   or
                   coalesce((ss.proportion_programme + ss.proportion_fait) * 100 >= cla.min_programme_percentage, false)
           end as atteint,
       cla.prio

    from labellisation_action_critere cla
    join scores sc on sc.action_id = cla.action_id
    join private.score_summary_of(sc) ss on true
    join private.action_node a on sc.action_id = a.action_id
    -- sous-action parente.
    left join private.action_node sa
                   on a.action_id = any (sa.descendants)
                       and a.type = 'tache'
                       and sa.type = 'sous-action'
    -- score sous-action parente
    left join scores sasc on sa.action_id = sasc.action_id
    -- score summary sous-action parente
    left join private.score_summary_of(sasc) sass on true

where not ss.desactive

    `;

    return this.db.execute(statement2);
  }

  async getParcoursLabellisationPgFunction({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }) {
    const statement = sql`
    WITH etoiles AS (
          SELECT etoiles.referentiel,
             etoiles.etoile_labellise,
             etoiles.prochaine_etoile_labellisation,
             etoiles.etoile_score_possible,
             etoiles.etoile_objectif
            FROM labellisation.etoiles(${collectiviteId}) etoiles(referentiel, etoile_labellise, prochaine_etoile_labellisation, etoile_score_possible, etoile_objectif)
         ), current_critere AS (
          SELECT c.referentiel,
             c.etoiles,
             c.action_id,
             c.formulation,
             c.score_realise,
             c.min_score_realise,
             c.score_programme,
             c.min_score_programme,
             c.atteint,
             c.prio
            FROM (labellisation.critere_action(${collectiviteId}) c(referentiel, etoiles, action_id, formulation, score_realise, min_score_realise, score_programme, min_score_programme, atteint, prio)
              JOIN etoiles e_1 ON (((e_1.referentiel = c.referentiel) AND (e_1.etoile_objectif >= c.etoiles))))
           WHERE ((
            (c.etoiles)::text)::integer = (
                SELECT ((max(lac.etoile))::text)::integer AS max
                FROM labellisation_action_critere lac
                WHERE ((((e_1.etoile_objectif)::text)::integer >= ((lac.etoile)::text)::integer) AND ((c.action_id)::text = (lac.action_id)::text))
                GROUP BY lac.action_id
              ))
         ), criteres AS (
          SELECT ral.referentiel,
             ral.atteints,
             ral.liste
            FROM ( SELECT c.referentiel,
                     bool_and(c.atteint) AS atteints,
                     jsonb_agg(jsonb_build_object('formulation', c.formulation, 'prio', c.prio, 'action_id', c.action_id, 'rempli', c.atteint, 'etoile', c.etoiles, 'action_identifiant', ad.identifiant, 'statut_ou_score',
                         CASE
                             WHEN ((c.min_score_realise = (100)::double precision) AND (c.min_score_programme IS NULL)) THEN 'Fait'::text
                             WHEN ((c.min_score_realise = (100)::double precision) AND (c.min_score_programme = (100)::double precision)) THEN 'Programmé ou fait'::text
                             WHEN ((c.min_score_realise IS NOT NULL) AND (c.min_score_programme IS NULL)) THEN (c.min_score_realise || '% fait minimum'::text)
                             ELSE (((c.min_score_realise || '% fait minimum ou '::text) || c.min_score_programme) || '% programmé minimum'::text)
                         END)) AS liste
                    FROM (current_critere c
                      JOIN action_definition ad ON (((c.action_id)::text = (ad.action_id)::text)))
                   GROUP BY c.referentiel) ral
         )
  SELECT e.referentiel,
     e.etoile_objectif,
     rs.complet AS completude_ok,
     jsonb_build_object('score_a_realiser', cs.score_a_realiser, 'score_fait', cs.score_fait, 'atteint', cs.atteint, 'etoiles', cs.etoile_objectif) AS critere_score,
     criteres.liste AS criteres_action,
     (criteres.atteints AND cs.atteint AND
         CASE
             WHEN (cot.* IS NOT NULL) THEN true
             ELSE cf.atteint
         END) AS rempli,
     calendrier.information,
     -- to_jsonb(demande.*) AS to_jsonb,
     to_jsonb(labellisation.*) AS label,
     to_jsonb(audit.*) AS audit
    FROM ((((((((etoiles e
      JOIN criteres ON ((criteres.referentiel = e.referentiel)))
      LEFT JOIN labellisation.referentiel_score(${collectiviteId}) rs(referentiel, score_fait, score_programme, completude, complet) ON ((rs.referentiel = e.referentiel)))
      LEFT JOIN labellisation.critere_score_global(${collectiviteId}) cs(referentiel, etoile_objectif, score_a_realiser, score_fait, atteint) ON ((cs.referentiel = e.referentiel)))
      LEFT JOIN labellisation.critere_fichier(${collectiviteId}) cf(referentiel, preuve_nombre, atteint) ON ((cf.referentiel = e.referentiel)))
      LEFT JOIN labellisation_calendrier calendrier ON ((calendrier.referentiel = e.referentiel)))
      LEFT JOIN cot ON ((cot.collectivite_id = ${collectiviteId})))

      LEFT JOIN LATERAL ( SELECT d.id,
             d.en_cours,
             d.collectivite_id,
             d.referentiel,
             d.etoiles,
             d.date,
             d.sujet
            FROM labellisation_demande(labellisation_parcours.collectivite_id, e.referentiel) d(id, en_cours, collectivite_id, referentiel, etoiles, date, sujet, modified_at, envoyee_le, demandeur)) demande ON (true))

      LEFT JOIN LATERAL ( SELECT a.id,
             a.collectivite_id,
             a.referentiel,
             a.demande_id,
             a.date_debut,
             a.date_fin,
             a.valide
            FROM labellisation.current_audit(${collectiviteId}, e.referentiel) a(id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide, date_cnl, valide_labellisation, clos)) audit ON (true))

      LEFT JOIN LATERAL ( SELECT l.id,
             l.collectivite_id,
             l.referentiel,
             l.obtenue_le,
             l.annee,
             l.etoiles,
             l.score_realise,
             l.score_programme
            FROM labellisation l
           WHERE ((l.collectivite_id = ${collectiviteId}) AND (l.referentiel = e.referentiel))
           ORDER BY l.obtenue_le DESC
          LIMIT 1) labellisation ON (true)
      )
`;

    return this.db.execute(statement);
  }

  async getParcoursLabellisation({
    collectiviteId,
    referentielId,
    user,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
    user: AuthUser;
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
