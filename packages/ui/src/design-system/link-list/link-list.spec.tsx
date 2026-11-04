import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LinkList, LinkListItem } from './link-list';

afterEach(cleanup);

describe('LinkList', () => {
  it('rend une ligne avec `href` comme un lien', () => {
    render(
      <LinkList>
        <LinkListItem href="/outil" title="Outil" description="Description" />
      </LinkList>
    );

    const lien = screen.getByRole('link', { name: /Outil/ });
    expect(lien.getAttribute('href')).toBe('/outil');
    expect(screen.getByText('Description')).toBeTruthy();
  });

  it('rend une ligne avec `onClick` comme un bouton', () => {
    const onClick = vi.fn();
    render(
      <LinkList>
        <LinkListItem onClick={onClick} title="Fiche" />
      </LinkList>
    );

    fireEvent.click(screen.getByRole('button', { name: /Fiche/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
