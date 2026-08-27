import {
  AuditTypeOption,
  Etoile,
  ObjetPreuveEnum,
  ParcoursForAuditPrerequisites,
  SujetDemandeEnum,
  listAuditTypeOptions,
} from '@tet/domain/referentiels';
import {
  RenderResult,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RequestAuditForm } from './request-audit.form';

const AUDIT_TYPE_LEGEND = "Quel type d'audit souhaitez-vous demander ?";
const SUBMIT_BUTTON = 'Envoyer ma demande';

const toSatisfiedParcours = (
  isCOT: boolean
): ParcoursForAuditPrerequisites => ({
  labellisation: null,
  referentiel: 'cae',
  referentRolesDefined: { eluReferent: true, referentTechnique: true },
  completude_ok: true,
  critere_score: {
    atteint: true,
    score_a_realiser: 0.35,
    score_fait: 0.8,
  } as ParcoursForAuditPrerequisites['critere_score'],
  isCot: isCOT,
  etoiles: 2 as Etoile,
  conditionFichiers: { preuve_nombre: 1 },
  preuvesObjets: [
    { objet: ObjetPreuveEnum.ACTE_ENGAGEMENT },
    { objet: ObjetPreuveEnum.CANDIDATURE },
  ],
  criteres_action: [{ atteint: true, action_id: 'cae_1.1.1' }],
});

const toAuditTypeOptions = (
  isCOT: boolean,
  maximumRequestableStar: Etoile
): AuditTypeOption[] =>
  listAuditTypeOptions(toSatisfiedParcours(isCOT), {
    isCOT,
    maximumRequestableStar,
  });

const renderForm = (props: {
  isCOT: boolean;
  maximumRequestableStar: Etoile;
}): RenderResult =>
  render(
    <RequestAuditForm
      auditTypeOptions={toAuditTypeOptions(
        props.isCOT,
        props.maximumRequestableStar
      )}
      maximumRequestableStar={props.maximumRequestableStar}
      isPending={false}
      onSubmit={vi.fn()}
      onCancel={vi.fn()}
    />
  );

const targetStarField = (container: HTMLElement): Element | null =>
  container.querySelector('[data-test="target-star"]');

const getRadioButtonByName = (name: string): HTMLInputElement => {
  const element = screen.getByRole('radio', { name });
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`radio inattendu pour « ${name} »`);
  }
  return element;
};

const getSubmitButton = (): HTMLButtonElement => {
  const button = screen.getByRole('button', { name: SUBMIT_BUTTON });
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('bouton de soumission inattendu');
  }
  return button;
};

describe('RequestAuditForm', () => {
  it("non-COT avec score >= 35% : pas de choix de type d'audit, seulement le sélecteur d'étoile", () => {
    const { container } = renderForm({
      isCOT: false,
      maximumRequestableStar: 5,
    });
    expect(screen.queryByRole('group', { name: AUDIT_TYPE_LEGEND })).toBeNull();
    expect(targetStarField(container)).not.toBeNull();
  });

  it("COT sous 35 % : les deux types COT sont proposés, le labellisant grisé, sans sélecteur d'étoile", () => {
    const { container } = renderForm({
      isCOT: true,
      maximumRequestableStar: 1,
    });
    expect(getRadioButtonByName('Audit COT sans labellisation').disabled).toBe(
      false
    );
    expect(getRadioButtonByName('Audit COT avec labellisation').disabled).toBe(
      true
    );
    expect(getRadioButtonByName('Audit de labellisation').disabled).toBe(true);
    expect(targetStarField(container)).toBeNull();
  });

  it("COT avec score >= 35% : les trois types sont proposés, l'audit de labellisation compris", () => {
    renderForm({
      isCOT: true,
      maximumRequestableStar: 3,
    });
    const group = screen.getByRole('group', { name: AUDIT_TYPE_LEGEND });
    expect(
      within(group).getByRole('radio', { name: 'Audit COT sans labellisation' })
    ).toBeDefined();
    expect(
      within(group).getByRole('radio', { name: 'Audit COT avec labellisation' })
    ).toBeDefined();
    expect(
      within(group).getByRole('radio', { name: 'Audit de labellisation' })
    ).toBeDefined();
  });

  it("COT avec score >= 35% : le sélecteur d'étoile apparaît au choix d'un audit labellisant", () => {
    const { container } = renderForm({
      isCOT: true,
      maximumRequestableStar: 4,
    });
    expect(targetStarField(container)).toBeNull();
    fireEvent.click(
      screen.getByRole('radio', { name: 'Audit COT avec labellisation' })
    );
    expect(targetStarField(container)).not.toBeNull();
  });

  it("COT avec score >= 35% : choisir l'audit COT seul masque le sélecteur d'étoile", () => {
    const { container } = renderForm({
      isCOT: true,
      maximumRequestableStar: 4,
    });
    fireEvent.click(
      screen.getByRole('radio', { name: 'Audit COT sans labellisation' })
    );
    expect(targetStarField(container)).toBeNull();
  });

  it("présélectionne l'étoile-objectif dans le sélecteur d'étoile", () => {
    renderForm({ isCOT: false, maximumRequestableStar: 3 });
    expect(screen.getByText('troisième étoile')).toBeDefined();
  });

  it("non-COT : la soumission émet la sélection labellisation avec l'étoile présélectionnée", async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <RequestAuditForm
        auditTypeOptions={toAuditTypeOptions(false, 3)}
        maximumRequestableStar={3}
        isPending={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const form = container.querySelector('form');
    if (!form) {
      throw new Error('formulaire introuvable');
    }
    fireEvent.submit(form);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      sujet: SujetDemandeEnum.LABELLISATION,
      targetStar: 3,
    });
  });

  it('COT seul : la soumission émet { sujet: cot } sans étoile', async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <RequestAuditForm
        auditTypeOptions={toAuditTypeOptions(true, 3)}
        maximumRequestableStar={3}
        isPending={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('radio', { name: 'Audit COT sans labellisation' })
    );
    const form = container.querySelector('form');
    if (!form) {
      throw new Error('formulaire introuvable');
    }
    fireEvent.submit(form);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ sujet: SujetDemandeEnum.COT });
  });

  it("choix de type : « Envoyer ma demande » est désactivé tant qu'aucun type n'est choisi, puis activé après sélection", async () => {
    render(
      <RequestAuditForm
        auditTypeOptions={toAuditTypeOptions(true, 3)}
        maximumRequestableStar={3}
        isPending={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(getSubmitButton().disabled).toBe(true);

    fireEvent.click(
      screen.getByRole('radio', { name: 'Audit COT avec labellisation' })
    );

    await waitFor(() => expect(getSubmitButton().disabled).toBe(false));
  });

  it("options labellisantes grisées : « Envoyer ma demande » reste désactivé jusqu'au choix de l'audit COT seul", async () => {
    render(
      <RequestAuditForm
        auditTypeOptions={[
          { sujet: SujetDemandeEnum.COT, isRequestable: true, reason: null },
          {
            sujet: SujetDemandeEnum.LABELLISATION_COT,
            isRequestable: false,
            reason: 'SCORE_ACTIONS_CRITERIA_NOT_SATISFIED',
          },
          {
            sujet: SujetDemandeEnum.LABELLISATION,
            isRequestable: false,
            reason: 'SCORE_ACTIONS_CRITERIA_NOT_SATISFIED',
          },
        ]}
        maximumRequestableStar={3}
        isPending={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(getSubmitButton().disabled).toBe(true);

    screen.getByRole('radio', { name: 'Audit de labellisation' }).click();
    expect(getSubmitButton().disabled).toBe(true);

    screen.getByRole('radio', { name: 'Audit COT sans labellisation' }).click();

    await waitFor(() => expect(getSubmitButton().disabled).toBe(false));
  });
});
