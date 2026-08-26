import {
  AuditTypeOption,
  SujetDemande,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuditTypeField } from './audit-type.field';

const CRITERES_MESSAGE =
  'Renseigner tous les critères attendus afin de pouvoir demander un audit ou une labellisation';
const COT_AVEC_LABELLISATION_MESSAGE =
  '* Penser à joindre les documents de labellisation.';

const toRequestableOption = (sujet: SujetDemande): AuditTypeOption => ({
  sujet,
  isRequestable: true,
  reason: null,
});

const toBlockedOption = (sujet: SujetDemande): AuditTypeOption => ({
  sujet,
  isRequestable: false,
  reason: 'SCORE_ACTIONS_CRITERIA_NOT_SATISFIED',
});

const renderField = (
  options: readonly AuditTypeOption[],
  onChange = vi.fn()
): { onChange: ReturnType<typeof vi.fn> } => {
  render(<AuditTypeField options={options} value={null} onChange={onChange} />);
  return { onChange };
};

const radio = (name: string): HTMLInputElement => {
  const element = screen.getByRole('radio', { name });
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`radio inattendu pour « ${name} »`);
  }
  return element;
};

describe('AuditTypeField', () => {
  it("désactive le radio d'une option dont les prérequis ne sont pas remplis", () => {
    renderField([toBlockedOption(SujetDemandeEnum.LABELLISATION)]);
    expect(radio('Audit de labellisation').disabled).toBe(true);
    expect(screen.getByText(CRITERES_MESSAGE)).toBeDefined();
  });

  it("laisse actif et sans message le radio d'une option demandable", () => {
    renderField([toRequestableOption(SujetDemandeEnum.LABELLISATION)]);
    expect(radio('Audit de labellisation').disabled).toBe(false);
    expect(screen.queryByText(CRITERES_MESSAGE)).toBeNull();
  });

  it("n'appelle pas onChange au clic sur une option grisée", () => {
    const { onChange } = renderField([
      toBlockedOption(SujetDemandeEnum.LABELLISATION),
    ]);
    radio('Audit de labellisation').click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('appelle onChange avec le sujet au clic sur une option demandable', () => {
    const { onChange } = renderField([
      toRequestableOption(SujetDemandeEnum.LABELLISATION),
    ]);
    radio('Audit de labellisation').click();
    expect(onChange).toHaveBeenCalledWith(SujetDemandeEnum.LABELLISATION);
  });

  it("conserve le rappel des documents sur l'audit COT avec labellisation demandable", () => {
    renderField([toRequestableOption(SujetDemandeEnum.LABELLISATION_COT)]);
    expect(radio('Audit COT avec labellisation').disabled).toBe(false);
    expect(screen.getByText(COT_AVEC_LABELLISATION_MESSAGE)).toBeDefined();
  });

  it("remplace le rappel des documents par le motif quand l'audit COT avec labellisation n'est pas demandable", () => {
    renderField([toBlockedOption(SujetDemandeEnum.LABELLISATION_COT)]);
    expect(screen.getByText(CRITERES_MESSAGE)).toBeDefined();
    expect(screen.queryByText(COT_AVEC_LABELLISATION_MESSAGE)).toBeNull();
  });

  it('grise seulement les options non demandables du groupe', () => {
    renderField([
      toRequestableOption(SujetDemandeEnum.COT),
      toBlockedOption(SujetDemandeEnum.LABELLISATION_COT),
      toBlockedOption(SujetDemandeEnum.LABELLISATION),
    ]);
    expect(radio('Audit COT sans labellisation').disabled).toBe(false);
    expect(radio('Audit COT avec labellisation').disabled).toBe(true);
    expect(radio('Audit de labellisation').disabled).toBe(true);
  });
});
