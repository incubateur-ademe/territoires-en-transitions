import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { toIndicateurActions } from '../../table/to-indicateur-actions.fixture';
import { IndicateurActionsProvider } from '../context/indicateur-actions.context';
import { IndicateurDataProvider } from '../context/indicateur-data.context';
import { IndicateurNouveauSousIndicateurProvider } from '../context/indicateur-nouveau-sous-indicateur.context';
import { IndicateurSousIndicateursTableProvider } from '../context/indicateur-sous-indicateurs-table.context';
import IndicateurToolbar from './indicateur-toolbar.view';

const toIndicateur = ({
  enfants,
}: {
  enfants: { id: number; titre: string }[];
}): IndicateurDetaille =>
  ({
    id: 10,
    titre: 'Déchets',
    estFavori: false,
    enfants,
  } as IndicateurDetaille);

const renderToolbar = ({
  isPerso = true,
  canMutateIndicateur = true,
  enfants = [],
}: {
  isPerso?: boolean;
  canMutateIndicateur?: boolean;
  enfants?: { id: number; titre: string }[];
} = {}) => {
  const createSousIndicateur = vi.fn();
  const onCreated = vi.fn();
  render(
    <IndicateurDataProvider
      value={{
        indicateur: toIndicateur({ enfants }),
        canMutateIndicateur,
        canMutateValeur: true,
      }}
    >
      <IndicateurActionsProvider value={toIndicateurActions()}>
        <IndicateurSousIndicateursTableProvider
          value={
            {
              useCreateSousIndicateur: () => createSousIndicateur,
            } as never
          }
        >
          <IndicateurNouveauSousIndicateurProvider
            value={{ id: null, onCreated, onNameEditingEnd: vi.fn() }}
          >
            <IndicateurToolbar
              hasCollectivitePermission={() => true}
              isPerso={isPerso}
            />
          </IndicateurNouveauSousIndicateurProvider>
        </IndicateurSousIndicateursTableProvider>
      </IndicateurActionsProvider>
    </IndicateurDataProvider>
  );
  return { createSousIndicateur, onCreated };
};

const CREER = { name: appLabels.indicateurCreerSousIndicateur };

describe('IndicateurToolbar : création d un sous-indicateur', () => {
  it("crée un sous-indicateur nommé à la suite des enfants directs et transmet l'identifiant créé pour le focus", () => {
    const { createSousIndicateur, onCreated } = renderToolbar({
      enfants: [
        { id: 11, titre: 'Ménagers' },
        { id: 12, titre: 'Verre' },
      ],
    });

    fireEvent.click(screen.getByRole('button', CREER));

    expect(createSousIndicateur).toHaveBeenCalledWith(
      { parentId: 10, titre: 'Sous-indicateur 3' },
      { onCreated }
    );
  });

  it('a la même taille que les boutons favori et menu du bandeau', () => {
    renderToolbar();

    const { className } = screen.getByRole('button', CREER);

    expect(className).toContain('text-xs');
    expect(className).not.toContain('text-sm');
  });

  it('ne propose pas la création pour un indicateur prédéfini', () => {
    renderToolbar({ isPerso: false });

    expect(screen.queryByRole('button', CREER)).toBeNull();
  });

  it("ne propose pas la création sans le droit de modifier l'indicateur", () => {
    renderToolbar({ canMutateIndicateur: false });

    expect(screen.queryByRole('button', CREER)).toBeNull();
  });
});
