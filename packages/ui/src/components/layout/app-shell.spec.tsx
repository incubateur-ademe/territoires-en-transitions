import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppShell } from './app-shell';

afterEach(cleanup);

const renderShell = (props: {
  isSidePanelOpen?: boolean;
  belowFooter?: string;
}) =>
  render(
    <AppShell
      header={<header>En-tête</header>}
      footer={<footer>Pied</footer>}
      sidePanel={<aside>Panneau</aside>}
      {...props}
    >
      <main>Page</main>
    </AppShell>
  );

describe('AppShell', () => {
  it('rend le header, la page, le footer et le panneau latéral', () => {
    renderShell({});

    expect(screen.getByRole('banner').textContent).toBe('En-tête');
    expect(screen.getByRole('main').textContent).toBe('Page');
    expect(screen.getByRole('contentinfo').textContent).toBe('Pied');
    expect(screen.getByRole('complementary').textContent).toBe('Panneau');
  });

  it('masque header et page sous lg quand le panneau est ouvert', () => {
    renderShell({ isSidePanelOpen: true });

    const shell = screen.getByRole('main').closest('.grid');
    expect(shell?.className).toContain('lg:grid-cols-side-panel-open');
    expect(screen.getByRole('banner').parentElement?.className).toContain(
      'max-lg:hidden'
    );
  });

  it("n'affiche le contenu sous le footer que s'il est fourni", () => {
    const { rerender } = renderShell({});
    expect(screen.queryByText('Mention')).toBeNull();

    rerender(
      <AppShell header={null} footer={null} belowFooter="Mention">
        Page
      </AppShell>
    );
    expect(screen.getByText('Mention')).toBeTruthy();
  });
});
