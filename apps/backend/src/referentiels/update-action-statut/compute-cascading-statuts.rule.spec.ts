import {
  ActionStatutCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { cloneDeep } from 'es-toolkit';
import { deeperReferentielScoring } from '../models/samples/deeper-referentiel-scoring.sample';
import {
  computeAndMergeParentCascadingStatuts,
  computeCascadingParentStatuts,
} from './compute-cascading-statuts.rule';

const collectiviteId = 42;

describe('computeCascadeActionStatuts', () => {
  it('remet le parent sous-action à non_renseigne quand une tâche est mise à jour et le parent a un statut direct', () => {
    const actionStatuts: ActionStatutCreate[] = [
      {
        collectiviteId,
        actionId: 'eci_2.1.0',
        statut: StatutAvancementEnum.FAIT,
      },
    ];

    const cascade = computeCascadingParentStatuts(
      actionStatuts,
      deeperReferentielScoring,
      collectiviteId
    );

    expect(cascade).toEqual([
      {
        collectiviteId,
        actionId: 'eci_2.1',
        statut: StatutAvancementEnum.NON_RENSEIGNE,
        statutDetailleAuPourcentage: null,
      },
    ]);
  });

  it("ne reset pas le parent si le score courant n'a pas d'avancement direct (agrégé depuis les tâches)", () => {
    const actionStatuts: ActionStatutCreate[] = [
      {
        collectiviteId,
        actionId: 'eci_2.2.1',
        statut: StatutAvancementEnum.FAIT,
      },
    ];

    const cascade = computeCascadingParentStatuts(
      actionStatuts,
      deeperReferentielScoring,
      collectiviteId
    );

    expect(cascade).toEqual([]);
  });

  it("ne reset pas le parent s'il est déjà dans le lot explicite", () => {
    const actionStatuts: ActionStatutCreate[] = [
      {
        collectiviteId,
        actionId: 'eci_2.1.0',
        statut: StatutAvancementEnum.FAIT,
      },
      {
        collectiviteId,
        actionId: 'eci_2.1',
        statut: StatutAvancementEnum.PROGRAMME,
      },
    ];

    const cascade = computeCascadingParentStatuts(
      actionStatuts,
      deeperReferentielScoring,
      collectiviteId
    );

    expect(cascade).toEqual([]);
  });

  it('ignore les mises à jour qui ne concernent pas une tâche', () => {
    const actionStatuts: ActionStatutCreate[] = [
      {
        collectiviteId,
        actionId: 'eci_2.1',
        statut: StatutAvancementEnum.PAS_FAIT,
      },
    ];

    const cascade = computeCascadingParentStatuts(
      actionStatuts,
      deeperReferentielScoring,
      collectiviteId
    );

    expect(cascade).toEqual([]);
  });

  it('reset aussi si le parent est en detaille_au_pourcentage', () => {
    const tree = cloneDeep(deeperReferentielScoring);
    const sousAction = tree.actionsEnfant[1].actionsEnfant.find(
      (a) => a.actionId === 'eci_2.1'
    );
    if (!sousAction) {
      throw new Error('expected eci_2.1 in fixture');
    }
    sousAction.score.avancement = StatutAvancementEnum.DETAILLE_AU_POURCENTAGE;

    const actionStatuts: ActionStatutCreate[] = [
      {
        collectiviteId,
        actionId: 'eci_2.1.0',
        statut: StatutAvancementEnum.FAIT,
      },
    ];

    const cascade = computeCascadingParentStatuts(
      actionStatuts,
      tree,
      collectiviteId
    );

    expect(cascade).toEqual([
      {
        collectiviteId,
        actionId: 'eci_2.1',
        statut: StatutAvancementEnum.NON_RENSEIGNE,
        statutDetailleAuPourcentage: null,
      },
    ]);
  });
});

describe('computeAndMergeCascadingParentStatuts', () => {
  it('ajoute les statuts en cascade au lot explicite', () => {
    const explicit: ActionStatutCreate[] = [
      {
        collectiviteId,
        actionId: 'eci_2.1.0',
        statut: StatutAvancementEnum.FAIT,
      },
    ];

    const result = computeAndMergeParentCascadingStatuts(
      explicit,
      deeperReferentielScoring,
      collectiviteId
    );

    expect(result).toEqual([
      {
        collectiviteId,
        actionId: 'eci_2.1.0',
        statut: StatutAvancementEnum.FAIT,
      },
      {
        collectiviteId,
        actionId: 'eci_2.1',
        statut: StatutAvancementEnum.NON_RENSEIGNE,
        statutDetailleAuPourcentage: null,
      },
    ]);
  });

  it('ne duplique pas un parent déjà présent dans le lot explicite', () => {
    const explicit: ActionStatutCreate[] = [
      {
        collectiviteId,
        actionId: 'eci_2.1.0',
        statut: StatutAvancementEnum.FAIT,
      },
      {
        collectiviteId,
        actionId: 'eci_2.1',
        statut: StatutAvancementEnum.PROGRAMME,
      },
    ];

    const result = computeAndMergeParentCascadingStatuts(
      explicit,
      deeperReferentielScoring,
      collectiviteId
    );

    // Le parent est déjà dans le lot explicite, donc on ne doit pas ajouter
    // un reset en cascade pour le même parent.
    expect(result).toEqual(explicit);
  });
});
