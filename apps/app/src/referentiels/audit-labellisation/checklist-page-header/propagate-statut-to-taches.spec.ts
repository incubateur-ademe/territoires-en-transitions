import { ActionId, StatutAvancementEnum } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import {
  propagateStatutToTaches,
  SousAction,
} from './propagate-statut-to-taches';

const collectiviteId = 42;

const sousActionId: ActionId = 'eci_1.1.1';
const referentTechniqueId: ActionId = 'eci_1.1.1.3';
const eluReferentId: ActionId = 'eci_1.1.1.1';
const visionPolitiqueId: ActionId = 'eci_1.1.1.2';

const aRenseigner = { concerne: true, desactive: false };

const toSousAction = ({
  avancement,
  avancementDetaille = null,
  tachesWithoutStatut = [eluReferentId, visionPolitiqueId],
  tachesWithStatut = [],
  tachesNonConcernees = [],
  tachesDesactivees = [],
}: {
  avancement: SousAction['score']['avancement'];
  avancementDetaille?: SousAction['score']['avancementDetaille'];
  tachesWithoutStatut?: ActionId[];
  tachesWithStatut?: ActionId[];
  tachesNonConcernees?: ActionId[];
  tachesDesactivees?: ActionId[];
}): SousAction => ({
  actionId: sousActionId,
  score: { avancement, avancementDetaille, ...aRenseigner },
  actionsEnfant: [
    { actionId: referentTechniqueId, score: { ...aRenseigner } },
    ...tachesWithoutStatut.map((actionId) => ({
      actionId,
      score: { ...aRenseigner },
    })),
    ...tachesWithStatut.map((actionId) => ({
      actionId,
      score: { avancement: StatutAvancementEnum.FAIT, ...aRenseigner },
    })),
    ...tachesNonConcernees.map((actionId) => ({
      actionId,
      score: { concerne: false, desactive: false },
    })),
    ...tachesDesactivees.map((actionId) => ({
      actionId,
      score: { concerne: false, desactive: true },
    })),
  ],
});

describe('propagateStatutToTaches', () => {
  it('met la mesure du rôle à fait', () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({ avancement: undefined }),
      statut: StatutAvancementEnum.FAIT,
    });

    expect(statuts).toEqual([
      {
        collectiviteId,
        actionId: referentTechniqueId,
        statut: StatutAvancementEnum.FAIT,
        statutDetailleAuPourcentage: null,
      },
    ]);
  });

  it('recopie le statut direct de la sous-action sur les tâches sœurs qui en sont dépourvues', () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({
        avancement: StatutAvancementEnum.PAS_FAIT,
      }),
      statut: StatutAvancementEnum.FAIT,
    });

    expect(statuts).toEqual([
      {
        collectiviteId,
        actionId: referentTechniqueId,
        statut: StatutAvancementEnum.FAIT,
        statutDetailleAuPourcentage: null,
      },
      {
        collectiviteId,
        actionId: eluReferentId,
        statut: StatutAvancementEnum.PAS_FAIT,
        statutDetailleAuPourcentage: null,
      },
      {
        collectiviteId,
        actionId: visionPolitiqueId,
        statut: StatutAvancementEnum.PAS_FAIT,
        statutDetailleAuPourcentage: null,
      },
      {
        collectiviteId,
        actionId: sousActionId,
        statut: StatutAvancementEnum.DETAILLE_A_LA_TACHE,
        statutDetailleAuPourcentage: null,
      },
    ]);
  });

  it('bascule explicitement la sous-action en détaillé à la tâche, pour que le backend ne génère pas un reset par tâche du lot', () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({
        avancement: StatutAvancementEnum.PAS_FAIT,
      }),
      statut: StatutAvancementEnum.FAIT,
    });

    expect(statuts.filter(({ actionId }) => actionId === sousActionId)).toEqual(
      [
        {
          collectiviteId,
          actionId: sousActionId,
          statut: StatutAvancementEnum.DETAILLE_A_LA_TACHE,
          statutDetailleAuPourcentage: null,
        },
      ]
    );
  });

  it("assigner le référent technique n'écrase pas le statut déjà saisi sur l'élu référent", () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({
        avancement: StatutAvancementEnum.PAS_FAIT,
        tachesWithoutStatut: [visionPolitiqueId],
        tachesWithStatut: [eluReferentId],
      }),
      statut: StatutAvancementEnum.FAIT,
    });

    expect(statuts).toEqual([
      {
        collectiviteId,
        actionId: referentTechniqueId,
        statut: StatutAvancementEnum.FAIT,
        statutDetailleAuPourcentage: null,
      },
      {
        collectiviteId,
        actionId: visionPolitiqueId,
        statut: StatutAvancementEnum.PAS_FAIT,
        statutDetailleAuPourcentage: null,
      },
      {
        collectiviteId,
        actionId: sousActionId,
        statut: StatutAvancementEnum.DETAILLE_A_LA_TACHE,
        statutDetailleAuPourcentage: null,
      },
    ]);
  });

  it('recopie le détail au pourcentage de la sous-action tel quel', () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({
        avancement: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        avancementDetaille: [0.5, 0.25, 0.25],
        tachesWithoutStatut: [eluReferentId],
      }),
      statut: StatutAvancementEnum.FAIT,
    });

    expect(statuts).toContainEqual({
      collectiviteId,
      actionId: eluReferentId,
      statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
      statutDetailleAuPourcentage: [0.5, 0.25, 0.25],
    });
  });

  it('ne recopie rien quand la sous-action est détaillée au pourcentage sans détail exploitable', () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({
        avancement: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        avancementDetaille: null,
      }),
      statut: StatutAvancementEnum.FAIT,
    });

    expect(statuts.map(({ actionId }) => actionId)).toEqual([
      referentTechniqueId,
      sousActionId,
    ]);
  });

  it('recopie aussi lors du retrait du rôle, qui remet la mesure à non renseigné', () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({
        avancement: StatutAvancementEnum.PAS_FAIT,
        tachesWithoutStatut: [eluReferentId],
      }),
      statut: StatutAvancementEnum.NON_RENSEIGNE,
    });

    expect(statuts).toEqual([
      {
        collectiviteId,
        actionId: referentTechniqueId,
        statut: StatutAvancementEnum.NON_RENSEIGNE,
        statutDetailleAuPourcentage: null,
      },
      {
        collectiviteId,
        actionId: eluReferentId,
        statut: StatutAvancementEnum.PAS_FAIT,
        statutDetailleAuPourcentage: null,
      },
      {
        collectiviteId,
        actionId: sousActionId,
        statut: StatutAvancementEnum.DETAILLE_A_LA_TACHE,
        statutDetailleAuPourcentage: null,
      },
    ]);
  });

  it('ne recopie rien sur une tâche sœur déclarée non concernée, dont la déclaration serait effacée', () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({
        avancement: StatutAvancementEnum.PAS_FAIT,
        tachesWithoutStatut: [],
        tachesNonConcernees: [visionPolitiqueId],
      }),
      statut: StatutAvancementEnum.FAIT,
    });

    expect(statuts.map(({ actionId }) => actionId)).toEqual([
      referentTechniqueId,
      sousActionId,
    ]);
  });

  it('exclut du lot une tâche sœur désactivée, que le backend rejetterait en entier', () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({
        avancement: StatutAvancementEnum.PAS_FAIT,
        tachesWithoutStatut: [],
        tachesDesactivees: [visionPolitiqueId],
      }),
      statut: StatutAvancementEnum.FAIT,
    });

    expect(statuts.map(({ actionId }) => actionId)).toEqual([
      referentTechniqueId,
      sousActionId,
    ]);
  });

  it("retirer le référent technique n'écrase pas le statut déjà saisi sur l'élu référent", () => {
    const statuts = propagateStatutToTaches({
      collectiviteId,
      tacheId: referentTechniqueId,
      sousAction: toSousAction({
        avancement: StatutAvancementEnum.PAS_FAIT,
        tachesWithoutStatut: [visionPolitiqueId],
        tachesWithStatut: [eluReferentId],
      }),
      statut: StatutAvancementEnum.NON_RENSEIGNE,
    });

    expect(statuts).toEqual([
      {
        collectiviteId,
        actionId: referentTechniqueId,
        statut: StatutAvancementEnum.NON_RENSEIGNE,
        statutDetailleAuPourcentage: null,
      },
      {
        collectiviteId,
        actionId: visionPolitiqueId,
        statut: StatutAvancementEnum.PAS_FAIT,
        statutDetailleAuPourcentage: null,
      },
      {
        collectiviteId,
        actionId: sousActionId,
        statut: StatutAvancementEnum.DETAILLE_A_LA_TACHE,
        statutDetailleAuPourcentage: null,
      },
    ]);
  });
});
