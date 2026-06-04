import { ActionId } from '@tet/domain/referentiels';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRoleDropdown } from '../checklist.context';
import { RoleMesureItem } from './role-mesure.item';
import { useRoleMesure } from './use-role-mesure';

vi.mock('../checklist.context', () => ({
  useRoleDropdown: vi.fn(),
}));

vi.mock('./use-role-mesure', () => ({
  useRoleMesure: vi.fn(),
}));

const mockedUseRoleMesure = vi.mocked(useRoleMesure);
const mockedUseRoleDropdown = vi.mocked(useRoleDropdown);

describe('RoleMesureItem — aucun pilote assigné', () => {
  it("affiche le badge « À compléter » en capitale quand aucun pilote n'est renseigné", () => {
    mockedUseRoleMesure.mockReturnValue({
      pilotes: [],
      arePilotesLoading: false,
      isReadOnly: true,
      isMutating: false,
      saveRoleMesure: vi.fn(),
    });
    mockedUseRoleDropdown.mockReturnValue({
      activeActionId: null,
      openDropdown: vi.fn(),
      closeDropdown: vi.fn(),
    });

    render(
      <RoleMesureItem
        actionId={'eci_1' as ActionId}
        icon="user-line"
        label={() => 'Pilote'}
      />
    );

    expect(screen.getByText('À compléter')).toBeDefined();
  });
});
