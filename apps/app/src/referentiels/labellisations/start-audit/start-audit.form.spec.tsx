import { Etoile, SujetDemandeEnum } from '@tet/domain/referentiels';
import {
  RenderResult,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StartAuditForm } from './start-audit.form';

const AUDIT_TYPE_LEGEND = "Quel type d'audit souhaitez-vous demander ?";
const SUBMIT_BUTTON = 'Envoyer ma demande';

const renderForm = (props: {
  isCOT: boolean;
  canRequestLabellisation?: boolean;
  maximumRequestableStar: Etoile;
}): RenderResult =>
  render(
    <StartAuditForm
      isCOT={props.isCOT}
      canRequestLabellisation={props.canRequestLabellisation ?? true}
      maximumRequestableStar={props.maximumRequestableStar}
      isPending={false}
      onSubmit={vi.fn()}
      onCancel={vi.fn()}
    />
  );

const targetStarField = (container: HTMLElement): Element | null =>
  container.querySelector('[data-test="target-star"]');

describe('StartAuditForm', () => {
  it("non-COT avec score >= 35% : pas de choix de type d'audit, seulement le sélecteur d'étoile", () => {
    const { container } = renderForm({
      isCOT: false,
      maximumRequestableStar: 5,
    });
    expect(
      screen.queryByRole('group', { name: AUDIT_TYPE_LEGEND })
    ).toBeNull();
    expect(targetStarField(container)).not.toBeNull();
  });

  it("COT avec score < 35% : ni choix de type, ni sélecteur d'étoile", () => {
    const { container } = renderForm({
      isCOT: true,
      canRequestLabellisation: false,
      maximumRequestableStar: 1,
    });
    expect(
      screen.queryByRole('group', { name: AUDIT_TYPE_LEGEND })
    ).toBeNull();
    expect(targetStarField(container)).toBeNull();
  });

  it('COT avec score >= 35% : les trois types sont proposés', () => {
    renderForm({
      isCOT: true,
      canRequestLabellisation: true,
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
      canRequestLabellisation: true,
      maximumRequestableStar: 4,
    });
    expect(targetStarField(container)).toBeNull();
    fireEvent.click(
      screen.getByRole('radio', { name: 'Audit de labellisation' })
    );
    expect(targetStarField(container)).not.toBeNull();
  });

  it("COT avec score >= 35% : choisir l'audit COT seul masque le sélecteur d'étoile", () => {
    const { container } = renderForm({
      isCOT: true,
      canRequestLabellisation: true,
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

  it.each<[Etoile, number[]]>([
    [2, [2]],
    [3, [2, 3]],
    [4, [2, 3, 4]],
    [5, [2, 3, 4, 5]],
  ])(
    'étoile-objectif %i : le sélecteur propose exactement les étoiles %j',
    (maximumRequestableStar, expectedStars) => {
      const { container } = renderForm({
        isCOT: false,
        maximumRequestableStar,
      });
      const trigger = container.querySelector('[data-test="target-star"]');
      if (!trigger) {
        throw new Error("sélecteur d'étoile introuvable");
      }
      fireEvent.click(trigger);

      const renderedStars = [2, 3, 4, 5].filter((star) =>
        document.querySelector(`[data-test="${star}"]`)
      );
      expect(renderedStars).toEqual(expectedStars);
    }
  );

  it("non-COT : la soumission émet la sélection labellisation avec l'étoile présélectionnée", async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <StartAuditForm
        isCOT={false}
        canRequestLabellisation
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
      <StartAuditForm
        isCOT
        canRequestLabellisation
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
      <StartAuditForm
        isCOT
        canRequestLabellisation
        maximumRequestableStar={3}
        isPending={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const submitBefore = screen.getByRole('button', { name: SUBMIT_BUTTON });
    if (!(submitBefore instanceof HTMLButtonElement)) {
      throw new Error('bouton de soumission inattendu');
    }
    expect(submitBefore.disabled).toBe(true);

    fireEvent.click(
      screen.getByRole('radio', { name: 'Audit de labellisation' })
    );

    await waitFor(() => {
      const submitAfter = screen.getByRole('button', { name: SUBMIT_BUTTON });
      if (!(submitAfter instanceof HTMLButtonElement)) {
        throw new Error('bouton de soumission inattendu');
      }
      expect(submitAfter.disabled).toBe(false);
    });
  });
});
