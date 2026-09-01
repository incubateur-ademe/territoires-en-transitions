import { ObjetPreuveEnum } from '@tet/domain/referentiels';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReclassifyDocumentField } from './reclassify-document.field';

const ACTE_ENGAGEMENT_LABEL = "Acte d'engagement";
const CANDIDATURE_LABEL = 'Document de candidature';
const NON_CLASSE_LABEL = 'Non classé';

const getRadioButtonByName = (name: string): HTMLInputElement => {
  const element = screen.getByRole('radio', { name });
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`unexpected radio for "${name}"`);
  }
  return element;
};

const renderField = (
  value: Parameters<typeof ReclassifyDocumentField>[0]['value']
): { onChange: ReturnType<typeof vi.fn> } => {
  const onChange = vi.fn();
  render(<ReclassifyDocumentField value={value} onChange={onChange} />);
  return { onChange };
};

describe('ReclassifyDocumentField', () => {
  it("coche le choix correspondant à l'objet courant du document", () => {
    renderField(ObjetPreuveEnum.CANDIDATURE);

    expect(getRadioButtonByName(CANDIDATURE_LABEL).checked).toBe(true);
    expect(getRadioButtonByName(ACTE_ENGAGEMENT_LABEL).checked).toBe(false);
    expect(getRadioButtonByName(NON_CLASSE_LABEL).checked).toBe(false);
  });

  it('coche « non classé » pour un document sans objet', () => {
    renderField(null);

    expect(getRadioButtonByName(NON_CLASSE_LABEL).checked).toBe(true);
  });

  it("remonte l'objet sélectionné", () => {
    const { onChange } = renderField(ObjetPreuveEnum.CANDIDATURE);

    fireEvent.click(getRadioButtonByName(ACTE_ENGAGEMENT_LABEL));

    expect(onChange).toHaveBeenCalledWith(ObjetPreuveEnum.ACTE_ENGAGEMENT);
  });

  it("remonte une absence d'objet quand « non classé » est choisi", () => {
    const { onChange } = renderField(ObjetPreuveEnum.CANDIDATURE);

    fireEvent.click(getRadioButtonByName(NON_CLASSE_LABEL));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
