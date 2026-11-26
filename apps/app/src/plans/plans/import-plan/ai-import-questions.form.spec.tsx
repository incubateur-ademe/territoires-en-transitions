import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiImportQuestionsForm } from './ai-import-questions.form';
import {
  actionLevelDoubt,
  actionsWithoutFicheDoubt,
  themeGroupingDoubt,
} from './ai-import-questions.fixture';
import type { ImportDoubt } from './ai-import-questions.model';

const renderForm = (
  doubts: ImportDoubt[],
  { withSousActions = true, onSubmit = vi.fn() } = {}
) => {
  render(
    <AiImportQuestionsForm
      doubts={doubts}
      withSousActions={withSousActions}
      onSubmit={onSubmit}
    />
  );
  return onSubmit;
};

const radiogroup = (title: string) =>
  screen.getByRole('radiogroup', { name: title });

const radiosOf = (title: string) =>
  within(radiogroup(title)).getAllByRole('radio') as HTMLInputElement[];

const checkedOf = (title: string) =>
  radiosOf(title).map(({ checked }) => checked);

const submit = () =>
  fireEvent.click(
    screen.getByRole('button', {
      name: appLabels.importPlanIaQuestionContinuer,
    })
  );

describe('AiImportQuestionsForm, une seule question', () => {
  it('montre les niveaux du document, le choix proposé coché', () => {
    renderForm([actionLevelDoubt]);

    expect(
      screen.getByText(appLabels.importPlanIaQuestionDocumentLu({ count: 1 }))
    ).toBeTruthy();
    expect(
      screen.queryByText(
        appLabels.importPlanIaQuestionPosition({ position: 1, total: 1 })
      )
    ).toBeNull();
    expect(screen.getByText(actionLevelDoubt.fiches.exampleTitle)).toBeTruthy();
    expect(screen.getByText(actionLevelDoubt.etapes.exampleTitle)).toBeTruthy();
    expect(checkedOf(appLabels.importPlanIaQuestionTitre)).toEqual([
      true,
      false,
    ]);
    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionConsequenceFiche({
          axes: 5,
          sousAxes: 0,
          actions: 16,
          sousActions: 54,
        })
      )
    ).toBeTruthy();
  });

  it("chiffre l'autre lecture quand on la choisit, et l'envoie", () => {
    const onSubmit = renderForm([actionLevelDoubt]);

    fireEvent.click(radiosOf(appLabels.importPlanIaQuestionTitre)[1]);

    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionConsequenceEtape({
          axes: 5,
          sousAxes: 16,
          actions: 54,
          sousActions: 0,
        })
      )
    ).toBeTruthy();
    submit();
    expect(onSubmit).toHaveBeenCalledWith([
      { kind: 'action-level', actionLevel: 'etape' },
    ]);
  });

  it('parle des éléments énumérés quand ce sont eux, proposés, qui font les actions', () => {
    const onSubmit = renderForm([
      {
        ...actionLevelDoubt,
        etapesFrom: 'enumeration',
        fiches: {
          exampleTitle: 'Développer le vélo',
          examplePage: 5,
          count: 11,
        },
        fichesWithEtapes: 11,
        etapes: {
          exampleTitle: 'Organiser des bourses à vélo',
          examplePage: 5,
          count: 43,
        },
        proposed: 'etape',
      },
    ]);

    expect(checkedOf(appLabels.importPlanIaQuestionTitre)).toEqual([
      false,
      true,
    ]);
    expect(document.body.textContent).toContain(
      appLabels.importPlanIaQuestionRaisonElement
    );
    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionConsequenceElement({
          axes: 5,
          sousAxes: 11,
          actions: 43,
          sousActions: 0,
        })
      )
    ).toBeTruthy();

    fireEvent.click(radiosOf(appLabels.importPlanIaQuestionTitre)[0]);

    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionConsequenceMesure({
          axes: 5,
          sousAxes: 0,
          actions: 11,
          sousActions: 43,
        })
      )
    ).toBeTruthy();
    submit();
    expect(onSubmit).toHaveBeenCalledWith([
      { kind: 'action-level', actionLevel: 'fiche' },
    ]);
  });

  it("n'annonce pas de sous-action quand l'import ne les crée pas", () => {
    renderForm([actionLevelDoubt], { withSousActions: false });

    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionConsequenceFiche({
          axes: 5,
          sousAxes: 0,
          actions: 16,
          sousActions: 0,
        })
      )
    ).toBeTruthy();
  });

  it('montre les thèmes que la synthèse réunit, avec leurs pages et une fiche de chacun', () => {
    const onSubmit = renderForm([themeGroupingDoubt]);

    const [group] = themeGroupingDoubt.groups;
    expect(screen.getByText(group.label)).toBeTruthy();
    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionThemesSynthese({ page: 3, count: 2 })
      )
    ).toBeTruthy();
    for (const variant of group.variants) {
      expect(screen.getByText(variant.theme)).toBeTruthy();
      expect(screen.getByText(variant.exampleTitle)).toBeTruthy();
    }
    expect(checkedOf(appLabels.importPlanIaQuestionThemesTitre)).toEqual([
      true,
      false,
    ]);
    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionThemesConsequenceRegrouper({
          themes: 2,
          axes: 1,
        })
      )
    ).toBeTruthy();

    fireEvent.click(radiosOf(appLabels.importPlanIaQuestionThemesTitre)[1]);

    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionThemesConsequenceSeparer({ themes: 2 })
      )
    ).toBeTruthy();
    submit();
    expect(onSubmit).toHaveBeenCalledWith([
      { kind: 'theme-grouping', grouping: 'separate' },
    ]);
  });

  it('montre le récapitulatif, ses pages et une action sans fiche', () => {
    renderForm([actionsWithoutFicheDoubt]);

    expect(
      screen.getByText(
        'Le tableau récapitulatif (p. 48-49) liste 51 actions, mais seules 24 ont une fiche détaillée.'
      )
    ).toBeTruthy();
    expect(
      screen.getByText(actionsWithoutFicheDoubt.example.title)
    ).toBeTruthy();
    expect(
      checkedOf(appLabels.importPlanIaQuestionActionsSansFicheTitre)
    ).toEqual([true, false]);
    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionActionsSansFicheConsequenceToutes({
          listed: 51,
          withoutFiche: 27,
        })
      )
    ).toBeTruthy();
  });
});

describe('AiImportQuestionsForm, plusieurs questions', () => {
  it('pose deux questions ensemble et envoie une réponse pour chacune', () => {
    const onSubmit = renderForm([actionLevelDoubt, themeGroupingDoubt]);

    expect(
      screen.getByText(appLabels.importPlanIaQuestionDocumentLu({ count: 2 }))
    ).toBeTruthy();
    expect(
      screen.getByText(
        appLabels.importPlanIaQuestionPosition({ position: 2, total: 2 })
      )
    ).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(1);

    submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith([
      { kind: 'action-level', actionLevel: 'fiche' },
      { kind: 'theme-grouping', grouping: 'grouped' },
    ]);
  });

  it('garde chaque réponse indépendante des autres questions', () => {
    const onSubmit = renderForm([
      actionLevelDoubt,
      themeGroupingDoubt,
      actionsWithoutFicheDoubt,
    ]);

    fireEvent.click(
      radiosOf(appLabels.importPlanIaQuestionActionsSansFicheTitre)[1]
    );
    fireEvent.click(radiosOf(appLabels.importPlanIaQuestionTitre)[1]);

    expect(checkedOf(appLabels.importPlanIaQuestionThemesTitre)).toEqual([
      true,
      false,
    ]);
    expect(
      checkedOf(appLabels.importPlanIaQuestionActionsSansFicheTitre)
    ).toEqual([false, true]);
    expect(checkedOf(appLabels.importPlanIaQuestionTitre)).toEqual([
      false,
      true,
    ]);
    submit();
    expect(onSubmit).toHaveBeenCalledWith([
      { kind: 'action-level', actionLevel: 'etape' },
      { kind: 'theme-grouping', grouping: 'grouped' },
      { kind: 'actions-without-fiche', actions: 'with-fiche' },
    ]);
  });

  it('bloque les réponses pendant l’envoi', () => {
    render(
      <AiImportQuestionsForm
        doubts={[actionLevelDoubt, actionsWithoutFicheDoubt]}
        withSousActions
        onSubmit={vi.fn()}
        isAnswering
      />
    );

    expect(
      (screen.getAllByRole('radio') as HTMLInputElement[]).every(
        ({ disabled }) => disabled
      )
    ).toBe(true);
  });
});
