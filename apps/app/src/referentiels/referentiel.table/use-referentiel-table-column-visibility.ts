import { VisibilityState } from '@tanstack/react-table';
import { useUser } from '@tet/api/users';
import { useCallback } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY_PREFIX = 'tet_referentiel_table_columns_visibility';

export type ReferentielTableColumnOption = {
  id: string;
  label: string;
};

// Ordre de présentation des colonnes dans le sélecteur de visibilité.
// Garde la colonne "Intitulé" toujours visible en l'excluant de cette liste.
export const REFERENTIEL_TABLE_COLUMN_OPTIONS: ReferentielTableColumnOption[] =
  [
    { id: 'description', label: 'Description' },
    { id: 'phase', label: 'Phase' },
    { id: 'pointPotentiel', label: 'Potentiel personnalisé' },
    { id: 'pointReferentiel', label: 'Potentiel max' },
    { id: 'progression', label: 'Progression' },
    { id: 'pointNonRenseigne', label: 'Points restants' },
    { id: 'pointFait', label: 'Points faits' },
    { id: 'scoreRealise', label: '% fait' },
    { id: 'pointProgramme', label: 'Points programmés' },
    { id: 'scoreProgramme', label: '% programmés' },
    { id: 'pointPasFait', label: 'Points pas faits' },
    { id: 'scorePasFait', label: '% pas fait' },
    { id: 'statut', label: 'Statut' },
    { id: 'scoreExplication', label: "État d'avancement" },
    { id: 'documents', label: 'Documents' },
    { id: 'comments', label: 'Commentaires' },
    { id: 'pilotes', label: 'Pilotes' },
    { id: 'services', label: 'Service ou direction pilote' },
    { id: 'fiches', label: 'Actions liées' },
  ];

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = Object.fromEntries(
  REFERENTIEL_TABLE_COLUMN_OPTIONS.map(({ id }) => [id, true])
);

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}

export function useReferentielTableColumnVisibility() {
  const user = useUser();
  const [stored, setStored] = useLocalStorage<VisibilityState>(
    getStorageKey(user.id),
    DEFAULT_COLUMN_VISIBILITY
  );

  const columnVisibility: VisibilityState = {
    ...DEFAULT_COLUMN_VISIBILITY,
    ...(stored ?? {}),
  };

  // La colonne "statutDetaille" n'est pas exposée dans le sélecteur,
  // sa visibilité suit systématiquement celle de la colonne "statut".
  columnVisibility.statutDetaille = columnVisibility.statut !== false;

  const visibleColumnIds = REFERENTIEL_TABLE_COLUMN_OPTIONS.filter(
    ({ id }) => columnVisibility[id] !== false
  ).map(({ id }) => id);

  const setVisibleColumnIds = useCallback(
    (ids: string[]) => {
      const next = Object.fromEntries(
        REFERENTIEL_TABLE_COLUMN_OPTIONS.map(({ id }) => [id, ids.includes(id)])
      );
      setStored(next);
    },
    [setStored]
  );

  return {
    columnVisibility,
    visibleColumnIds,
    setVisibleColumnIds,
    columnOptions: REFERENTIEL_TABLE_COLUMN_OPTIONS,
  };
}
