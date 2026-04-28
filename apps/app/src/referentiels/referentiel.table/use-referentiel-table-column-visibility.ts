import { VisibilityState } from '@tanstack/react-table';
import { useUser } from '@tet/api/users';
import { useCallback } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY_PREFIX = 'tet_referentiel_table_columns_visibility';

export type ReferentielTableColumnOption = {
  id: string;
  label: string;
  default: boolean;
};

// Ordre de présentation des colonnes dans le sélecteur de visibilité.
// Garde la colonne "Intitulé" toujours visible en l'excluant de cette liste.
export const REFERENTIEL_TABLE_COLUMN_OPTIONS: ReferentielTableColumnOption[] =
  [
    { id: 'description', label: 'Description', default: false },
    { id: 'categorie', label: 'Phase', default: false },
    { id: 'pointPotentiel', label: 'Potentiel personnalisé', default: true },
    { id: 'pointReferentiel', label: 'Potentiel max', default: false },
    { id: 'progression', label: 'Progression', default: true },
    { id: 'pointNonRenseigne', label: 'Points restants', default: false },
    { id: 'pointFait', label: 'Points faits', default: true },
    { id: 'scoreRealise', label: '% fait', default: true },
    { id: 'pointProgramme', label: 'Points programmés', default: false },
    { id: 'scoreProgramme', label: '% programmé', default: false },
    { id: 'pointPasFait', label: 'Points pas faits', default: false },
    { id: 'scorePasFait', label: '% pas fait', default: false },
    { id: 'statut', label: 'Statut', default: true },
    { id: 'explication', label: "État d'avancement", default: true },
    { id: 'pilotes', label: 'Pilotes', default: false },
    { id: 'services', label: 'Service ou direction', default: false },
    { id: 'documents', label: 'Documents', default: true },
    { id: 'comments', label: 'Commentaires', default: false },
    { id: 'fiches', label: 'Actions liées', default: false },
  ];

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = Object.fromEntries(
  REFERENTIEL_TABLE_COLUMN_OPTIONS.map(({ id, default: defaultValue }) => [
    id,
    defaultValue,
  ])
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
