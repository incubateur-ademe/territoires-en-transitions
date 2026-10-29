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

const toSatisfiedParcours = ({
  isCOT,
  etoile,
}: {
  isCOT: boolean;
  etoile: Etoile;
}): ParcoursForAuditPrerequisites => ({
  labellisation: null,
  referentiel: 'cae',
  referentRolesDefined: { eluReferent: true, referentTechnique: true },
  completudeOk: true,
  critereScore: {
    atteint: true,
    scoreARealiser: 0.35,
    scoreFait: 0.8,
  } as ParcoursForAuditPrerequisites['critereScore'],
  isCot: isCOT,
  etoiles: etoile,
  conditionFichiers: { preuveNombre: 1 },
  preuvesObjets: [
    { objet: ObjetPreuveEnum.ACTE_ENGAGEMENT },
    { objet: ObjetPreuveEnum.CANDIDATURE },
  ],
  criteresAction: [{ atteint: true, actionId: 'cae_1.1.1' }],
});

const toAuditTypeOptions = (props: {
  isCOT: boolean;
  etoile: Etoile;
}): AuditTypeOption[] =>
  listAuditTypeOptions(toSatisfiedParcours(props), { isCOT: props.isCOT });

const renderForm = (
  props: { isCOT: boolean; etoile: Etoile },
  onSubmit = vi.fn()
): RenderResult =>
  render(
    <RequestAuditForm
      auditTypeOptions={toAuditTypeOptions(props)}
      etoile={props.etoile}
      isPending={false}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />
  );

const queryEtoileDemandee = (etoileLabel: string): HTMLElement | null =>
  screen.queryByText(`Étoile demandée : ${etoileLabel} étoile`);

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

const submit = (container: HTMLElement): void => {
  const form = container.querySelector('form');
  if (!form) {
    throw new Error('formulaire introuvable');
  }
  fireEvent.submit(form);
};

describe('RequestAuditForm', () => {
  it("non-COT : pas de choix de type d'audit, l'étoile de la checklist est rappelée", () => {
    renderForm({ isCOT: false, etoile: 3 });
    expect(screen.queryByRole('group', { name: AUDIT_TYPE_LEGEND })).toBeNull();
    expect(queryEtoileDemandee('troisième')).not.toBeNull();
  });

  it("COT sous 35 % : les trois types sont proposés, les deux labellisants grisés, sans rappel d'étoile", () => {
    renderForm({ isCOT: true, etoile: 1 });
    expect(getRadioButtonByName('Audit COT sans labellisation').disabled).toBe(
      false
    );
    expect(getRadioButtonByName('Audit COT avec labellisation').disabled).toBe(
      true
    );
    expect(getRadioButtonByName('Audit de labellisation').disabled).toBe(true);
    expect(queryEtoileDemandee('première')).toBeNull();
  });

  it("COT avec score >= 35% : les trois types sont proposés, l'audit de labellisation compris", () => {
    renderForm({ isCOT: true, etoile: 3 });
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

  it("COT : l'étoile de la checklist est rappelée au choix d'un audit labellisant", () => {
    renderForm({ isCOT: true, etoile: 4 });
    expect(queryEtoileDemandee('quatrième')).toBeNull();
    fireEvent.click(
      screen.getByRole('radio', { name: 'Audit COT avec labellisation' })
    );
    expect(queryEtoileDemandee('quatrième')).not.toBeNull();
  });

  it("COT : choisir l'audit COT seul masque le rappel d'étoile", () => {
    renderForm({ isCOT: true, etoile: 4 });
    fireEvent.click(
      screen.getByRole('radio', { name: 'Audit COT sans labellisation' })
    );
    expect(queryEtoileDemandee('quatrième')).toBeNull();
  });

  it('non-COT : la soumission émet la sélection labellisation', async () => {
    const onSubmit = vi.fn();
    const { container } = renderForm({ isCOT: false, etoile: 3 }, onSubmit);

    submit(container);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      sujet: SujetDemandeEnum.LABELLISATION,
    });
  });

  it('COT seul : la soumission émet { sujet: cot }', async () => {
    const onSubmit = vi.fn();
    const { container } = renderForm({ isCOT: true, etoile: 3 }, onSubmit);

    fireEvent.click(
      screen.getByRole('radio', { name: 'Audit COT sans labellisation' })
    );
    submit(container);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ sujet: SujetDemandeEnum.COT });
  });

  it("choix de type : « Envoyer ma demande » est désactivé tant qu'aucun type n'est choisi, puis activé après sélection", async () => {
    renderForm({ isCOT: true, etoile: 3 });

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
        etoile={3}
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
