import { appLabels } from '@/app/labels/catalog';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SousIndicateurDetachButton } from './sous-indicateur-detach.button';
import { SousIndicateurOpenLink } from './sous-indicateur-open.link';

const HITBOX_CLASSNAMES = ['flex', 'rounded', 'p-1', 'hover:bg-grey-3'];

describe('SousIndicateurDetachButton', () => {
  it("donnent à la dissociation la même zone cliquable et le même survol qu'à la flèche d'ouverture", () => {
    render(
      <>
        <SousIndicateurDetachButton label="Papier" onDetach={vi.fn()} />
        <SousIndicateurOpenLink label="Papier" href="/papier" />
      </>
    );

    const detach = screen.getByRole('button', {
      name: appLabels.indicateurSousIndicateurDissocier({ label: 'Papier' }),
    });
    const open = screen.getByRole('link', {
      name: appLabels.indicateurSousIndicateurOuvrir({ label: 'Papier' }),
    });

    HITBOX_CLASSNAMES.forEach((className) => {
      expect(open.className).toContain(className);
      expect(detach.className).toContain(className);
    });
  });
});
