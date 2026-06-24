'use client';

import type { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import FicheStatutBadge from '@/app/plans/fiches/show-fiche/components/fiche-statut.badge';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { InlineEditWrapper } from '@tet/ui';
import { JSX } from 'react';

/**
 * Statut éditable en place sur une carte fiche action (façon Notion).
 * Clic sur le badge → dropdown de statut. Réutilise les composants existants
 * de la vue tabulaire : InlineEditWrapper + StatutsSelectDropdown +
 * FicheStatutBadge + useUpdateFiche.
 */
export const FicheCardStatutEditable = ({
  fiche,
  canUpdate,
}: {
  fiche: FicheListItem;
  canUpdate: boolean;
}): JSX.Element => {
  const { mutate: updateFiche } = useUpdateFiche();

  if (!canUpdate) {
    return <FicheStatutBadge statut={fiche.statut} size="xs" />;
  }

  return (
    // Empêche le clic sur le statut de déclencher le lien de la carte.
    <span
      className="inline-flex"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <InlineEditWrapper
        floatingMatchReferenceHeight={false}
        renderOnEdit={({ openState }) => (
          <StatutsSelectDropdown
            values={fiche.statut}
            onChange={(statut) =>
              updateFiche({
                ficheId: fiche.id,
                ficheFields: { statut: statut || null },
              })
            }
            inlineEdit
            openState={openState}
            badgeSize="xs"
          />
        )}
      >
        <span className="inline-flex">
          <FicheStatutBadge statut={fiche.statut} size="xs" />
        </span>
      </InlineEditWrapper>
    </span>
  );
};
