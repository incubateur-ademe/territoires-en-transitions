import { appLabels } from '@/app/labels/catalog';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FicheCardLinkAction } from './fiche-card-link.action';

afterEach(cleanup);

describe('FicheCardLinkAction', () => {
  it("propose de lier l'action quand elle n'est pas liée", () => {
    render(<FicheCardLinkAction isLinked={false} onToggle={vi.fn()} />);

    expect(screen.getByTitle(appLabels.lierLAction)).toBeTruthy();
    expect(screen.queryByTitle(appLabels.dissocierAction)).toBeNull();
  });

  it("propose de dissocier l'action quand elle est déjà liée", () => {
    render(<FicheCardLinkAction isLinked onToggle={vi.fn()} />);

    expect(screen.getByTitle(appLabels.dissocierAction)).toBeTruthy();
    expect(screen.queryByTitle(appLabels.lierLAction)).toBeNull();
  });

  it('bascule le lien au clic', () => {
    const onToggle = vi.fn();
    render(<FicheCardLinkAction isLinked={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByTitle(appLabels.lierLAction));

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
