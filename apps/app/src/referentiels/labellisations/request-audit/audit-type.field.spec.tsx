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

const renderAuditTypeField = (
  options: readonly AuditTypeOption[],
  onChange = vi.fn()
): { onChange: ReturnType<typeof vi.fn> } => {
  render(<AuditTypeField options={options} value={null} onChange={onChange} />);
  return { onChange };
};

const getRadioButtonByName = (name: string): HTMLInputElement => {
  const element = screen.getByRole('radio', { name });
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`radio inattendu pour « ${name} »`);
  }
  return element;
};

describe('AuditTypeField', () => {
  it("désactive le radio d'une option dont les prérequis ne sont pas remplis", () => {
    renderAuditTypeField([toBlockedOption(SujetDemandeEnum.LABELLISATION)]);
    expect(getRadioButtonByName('Audit de labellisation').disabled).toBe(true);
    expect(screen.getByText(CRITERES_MESSAGE)).toBeDefined();
  });

  it("laisse actif et sans message le radio d'une option demandable", () => {
    renderAuditTypeField([toRequestableOption(SujetDemandeEnum.LABELLISATION)]);
    expect(getRadioButtonByName('Audit de labellisation').disabled).toBe(false);
    expect(screen.queryByText(CRITERES_MESSAGE)).toBeNull();
  });

  it("n'appelle pas onChange au clic sur une option grisée", () => {
    const { onChange } = renderAuditTypeField([
      toBlockedOption(SujetDemandeEnum.LABELLISATION),
    ]);
    getRadioButtonByName('Audit de labellisation').click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('appelle onChange avec le sujet au clic sur une option demandable', () => {
    const { onChange } = renderAuditTypeField([
      toRequestableOption(SujetDemandeEnum.LABELLISATION),
    ]);
    getRadioButtonByName('Audit de labellisation').click();
    expect(onChange).toHaveBeenCalledWith(SujetDemandeEnum.LABELLISATION);
  });

  it("conserve le rappel des documents sur l'audit COT avec labellisation demandable", () => {
    renderAuditTypeField([
      toRequestableOption(SujetDemandeEnum.LABELLISATION_COT),
    ]);
    expect(getRadioButtonByName('Audit COT avec labellisation').disabled).toBe(
      false
    );
    expect(screen.getByText(COT_AVEC_LABELLISATION_MESSAGE)).toBeDefined();
  });

  it("remplace le rappel des documents par le motif quand l'audit COT avec labellisation n'est pas demandable", () => {
    renderAuditTypeField([toBlockedOption(SujetDemandeEnum.LABELLISATION_COT)]);
    expect(screen.getByText(CRITERES_MESSAGE)).toBeDefined();
    expect(screen.queryByText(COT_AVEC_LABELLISATION_MESSAGE)).toBeNull();
  });

  it('grise seulement les options non demandables du groupe', () => {
    renderAuditTypeField([
      toRequestableOption(SujetDemandeEnum.COT),
      toBlockedOption(SujetDemandeEnum.LABELLISATION_COT),
      toBlockedOption(SujetDemandeEnum.LABELLISATION),
    ]);
    expect(getRadioButtonByName('Audit COT sans labellisation').disabled).toBe(
      false
    );
    expect(getRadioButtonByName('Audit COT avec labellisation').disabled).toBe(
      true
    );
    expect(getRadioButtonByName('Audit de labellisation').disabled).toBe(true);
  });
});
