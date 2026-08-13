import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Options from './Options';

const options = [
  { value: 'non_concerne', label: 'non concerné' },
  { value: 'faible', label: 'faible' },
  { value: 'moyen', label: 'moyen' },
  { value: 'fort', label: 'fort' },
];

const renderOptions = (props: Partial<Parameters<typeof Options>[0]> = {}) => {
  const onChange = vi.fn();
  render(
    <Options options={options} onChange={onChange} isLoading={false} {...props} />
  );
  return { onChange };
};

const option = (label: string) => screen.getByRole('button', { name: label });

describe('Options — navigation au clavier', () => {
  it('valide par Entrée l’option qui a le focus, et non celle mise en évidence au départ', () => {
    const { onChange } = renderOptions();

    // Le focus se déplace par tabulation : c'est lui qui doit faire foi.
    fireEvent.focus(option('moyen'));
    fireEvent.keyDown(option('moyen'), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledExactlyOnceWith('moyen');
  });

  it('déplace la mise en évidence avec le focus, pour n’avoir qu’un seul curseur', () => {
    renderOptions();

    fireEvent.focus(option('fort'));

    expect(option('fort')).toHaveAttribute(
      'data-select-keyboard-highlight',
      'true'
    );
    expect(option('faible')).not.toHaveAttribute(
      'data-select-keyboard-highlight'
    );
  });

  it('met en évidence l’option sélectionnée à l’ouverture', () => {
    renderOptions({ values: ['moyen'] });

    expect(option('moyen')).toHaveAttribute(
      'data-select-keyboard-highlight',
      'true'
    );
  });

  it('suit les flèches sans dépendre du focus', () => {
    const { onChange } = renderOptions({ values: ['faible'] });

    fireEvent.keyDown(option('faible'), { key: 'ArrowDown' });
    fireEvent.keyDown(option('faible'), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledExactlyOnceWith('moyen');
  });

  /**
   * Le rang était calculé sur toutes les options, y compris désactivées, alors
   * qu'Entrée consultait la liste des seules options sélectionnables.
   */
  it('ne décale pas la mise en évidence quand une option est désactivée', () => {
    const { onChange } = renderOptions({
      options: [
        { value: 'non_concerne', label: 'non concerné', disabled: true },
        { value: 'faible', label: 'faible' },
        { value: 'moyen', label: 'moyen' },
      ],
    });

    fireEvent.focus(option('moyen'));
    fireEvent.keyDown(option('moyen'), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledExactlyOnceWith('moyen');
  });
});
