import { SujetDemandeEnum } from '@tet/domain/referentiels';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SujetCotViseField } from './sujet-cot-vise.field';

const avecLabellisation = 'Avec labellisation';

describe('SujetCotViseField', () => {
  it("coche l'interrupteur quand la labellisation est visée", () => {
    render(
      <SujetCotViseField
        value={SujetDemandeEnum.LABELLISATION_COT}
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole('checkbox', { name: avecLabellisation })
    ).toHaveProperty('checked', true);
  });

  it("vise l'audit COT seul quand on désactive l'interrupteur", () => {
    const onChange = vi.fn();
    render(
      <SujetCotViseField
        value={SujetDemandeEnum.LABELLISATION_COT}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: avecLabellisation }));

    expect(onChange).toHaveBeenCalledWith(SujetDemandeEnum.COT);
  });

  it("revient à l'audit COT avec labellisation quand on réactive l'interrupteur", () => {
    const onChange = vi.fn();
    render(
      <SujetCotViseField value={SujetDemandeEnum.COT} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: avecLabellisation }));

    expect(onChange).toHaveBeenCalledWith(SujetDemandeEnum.LABELLISATION_COT);
  });
});
