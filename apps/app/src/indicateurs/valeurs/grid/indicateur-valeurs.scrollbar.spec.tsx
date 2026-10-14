import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IndicateurValeursScrollbar } from './indicateur-valeurs.scrollbar';

afterEach(cleanup);

describe('IndicateurValeursScrollbar', () => {
  it('reste disponible sans survol et pilote la position horizontale', () => {
    const onScroll = vi.fn();
    const { rerender } = render(
      <IndicateurValeursScrollbar
        scrollLeft={0}
        viewportWidth={800}
        contentWidth={2400}
        controls="table"
        onScroll={onScroll}
      />
    );
    const slider = screen.getByRole('slider', {
      name: 'Défilement horizontal du tableau',
    });
    expect(slider.getAttribute('aria-controls')).toBe('table');
    fireEvent.change(slider, { target: { value: '1200' } });
    expect(onScroll).toHaveBeenCalledWith(1200);
    rerender(
      <IndicateurValeursScrollbar
        scrollLeft={800}
        viewportWidth={800}
        contentWidth={2400}
        controls="table"
        onScroll={onScroll}
      />
    );
    expect((slider as HTMLInputElement).value).toBe('800');
    expect(slider.getAttribute('aria-valuetext')).toBe('50 %');
    fireEvent.focus(slider);
    expect(onScroll).toHaveBeenLastCalledWith(800);
  });

  it('ne propose pas de défilement lorsque toutes les colonnes sont visibles', () => {
    render(
      <IndicateurValeursScrollbar
        scrollLeft={0}
        viewportWidth={800}
        contentWidth={800}
        controls="table"
        onScroll={vi.fn()}
      />
    );
    expect(screen.queryByRole('slider')).toBeNull();
  });
});
