import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BannerInfoBox } from './banner-info.box';

const HTML = '<p>Maintenance prévue ce soir</p>';
const FERMER = 'Fermer la bannière';

describe('BannerInfoBox', () => {
  it('affiche une croix de fermeture quand la bannière est fermable', () => {
    render(
      <BannerInfoBox type="info" html={HTML} onDismiss={() => undefined} />
    );

    expect(screen.getByRole('button', { name: FERMER })).toBeDefined();
  });

  it("n'affiche pas de croix de fermeture sans gestionnaire de fermeture", () => {
    render(<BannerInfoBox type="info" html={HTML} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('notifie la fermeture au clic sur la croix', () => {
    const onDismiss = vi.fn();
    render(<BannerInfoBox type="info" html={HTML} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: FERMER }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
