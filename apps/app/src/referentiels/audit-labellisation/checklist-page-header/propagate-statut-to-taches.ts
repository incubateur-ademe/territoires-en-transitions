import {
  ActionId,
  ActionScore,
  ActionStatutCreate,
  StatutAvancementCreate,
  StatutAvancementEnum,
  StatutDetailleAuPourcentage,
} from '@tet/domain/referentiels';
import { match } from 'ts-pattern';

type ActionWithAvancement = {
  actionId: ActionId;
  score: Pick<
    ActionScore,
    'avancement' | 'avancementDetaille' | 'concerne' | 'desactive'
  >;
};

export type SousAction = ActionWithAvancement & {
  actionsEnfant: ActionWithAvancement[];
};

type StatutRenseigne = Exclude<
  NonNullable<ActionScore['avancement']>,
  typeof StatutAvancementEnum.NON_RENSEIGNE
>;

type StatutTache = Exclude<
  StatutAvancementCreate,
  typeof StatutAvancementEnum.DETAILLE_AU_POURCENTAGE
>;

const isStatutRenseigne = (
  avancement: ActionWithAvancement['score']['avancement']
): avancement is StatutRenseigne =>
  avancement != null && avancement !== StatutAvancementEnum.NON_RENSEIGNE;

/**
 * Une tâche déclarée non concernée, ou désactivée par la personnalisation, est
 * déjà comptée comme renseignée par le moteur de score et ne doit rien recevoir :
 * lui écrire un statut simple rétablirait `concerne` à vrai et effacerait la
 * déclaration. Le backend refuse par ailleurs tout lot contenant une action
 * désactivée, et rejetterait alors l'assignation entière.
 */
const mustInheritStatut = ({ score }: ActionWithAvancement): boolean =>
  !isStatutRenseigne(score.avancement) && score.concerne && !score.desactive;

const toPropagatedStatut = ({
  collectiviteId,
  actionId,
  avancement,
  avancementDetaille,
}: {
  collectiviteId: number;
  actionId: ActionId;
  avancement: StatutRenseigne;
  avancementDetaille: StatutDetailleAuPourcentage | null;
}): ActionStatutCreate | null =>
  match<StatutRenseigne, ActionStatutCreate | null>(avancement)
    .with(
      StatutAvancementEnum.FAIT,
      StatutAvancementEnum.PAS_FAIT,
      StatutAvancementEnum.PROGRAMME,
      (statut) => ({
        collectiviteId,
        actionId,
        statut,
        statutDetailleAuPourcentage: null,
      })
    )
    .with(StatutAvancementEnum.DETAILLE_AU_POURCENTAGE, (statut) => {
      if (!avancementDetaille) {
        return null;
      }
      return {
        collectiviteId,
        actionId,
        statut,
        statutDetailleAuPourcentage: avancementDetaille,
      };
    })
    .exhaustive();

const toSiblingTachesStatuts = ({
  collectiviteId,
  tacheId,
  sousAction,
  avancement,
  avancementDetaille,
}: {
  collectiviteId: number;
  tacheId: ActionId;
  sousAction: SousAction;
  avancement: StatutRenseigne;
  avancementDetaille: StatutDetailleAuPourcentage | null;
}): ActionStatutCreate[] =>
  sousAction.actionsEnfant
    .filter((tache) => tache.actionId !== tacheId)
    .filter(mustInheritStatut)
    .map((tache) =>
      toPropagatedStatut({
        collectiviteId,
        actionId: tache.actionId,
        avancement,
        avancementDetaille,
      })
    )
    .filter(
      (propagated): propagated is ActionStatutCreate => propagated !== null
    );

/**
 * Compose le lot de statuts à écrire pour renseigner une tâche sans faire
 * chuter la complétude du référentiel.
 *
 * Écrire le statut d'une tâche fait remettre à `non_renseigne`, côté backend,
 * le statut direct de sa sous-action parente — voir
 * `compute-cascading-statuts.rules.ts`. Les tâches sœurs que ce statut
 * couvrait deviendraient alors non renseignées, et le critère « Renseigner les
 * statuts de toutes les mesures » retomberait à non atteint. Le lot recopie
 * donc au préalable le statut de la sous-action sur ces tâches sœurs.
 *
 * La sous-action est incluse explicitement, en `detaille_a_la_tache` : c'est
 * la traduction exacte du reset attendu, et sa présence dans le lot empêche la
 * cascade d'en générer un par tâche envoyée, ce que l'upsert rejette.
 */
export const propagateStatutToTaches = ({
  collectiviteId,
  tacheId,
  statut,
  sousAction,
}: {
  collectiviteId: number;
  tacheId: ActionId;
  statut: StatutTache;
  sousAction: SousAction;
}): ActionStatutCreate[] => {
  const tacheStatut: ActionStatutCreate = {
    collectiviteId,
    actionId: tacheId,
    statut,
    statutDetailleAuPourcentage: null,
  };

  const { avancement, avancementDetaille } = sousAction.score;

  if (!isStatutRenseigne(avancement) || sousAction.score.desactive) {
    return [tacheStatut];
  }

  const sousActionDetaillee: ActionStatutCreate = {
    collectiviteId,
    actionId: sousAction.actionId,
    statut: StatutAvancementEnum.DETAILLE_A_LA_TACHE,
    statutDetailleAuPourcentage: null,
  };

  return [
    tacheStatut,
    ...toSiblingTachesStatuts({
      collectiviteId,
      tacheId,
      sousAction,
      avancement,
      avancementDetaille: avancementDetaille ?? null,
    }),
    sousActionDetaillee,
  ];
};
