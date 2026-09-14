import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EditCommentaireModal } from './edit-commentaire-modal';

describe('EditCommentaireModal', () => {
  it('affiche la période complète dans le titre', () => {
    const definition = {
      unite: 't',
    } as ComponentProps<typeof EditCommentaireModal>['definition'];

    render(
      <EditCommentaireModal
        periodeLabel="février 2026"
        commentaire=""
        definition={definition}
        type="resultat"
        openState={{ isOpen: true, setIsOpen: vi.fn() }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText(/février 2026/)).toBeDefined();
  });
});
