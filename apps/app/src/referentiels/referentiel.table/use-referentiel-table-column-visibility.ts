import { appLabels } from '@/app/labels/catalog';
import { VisibilityState } from '@tanstack/react-table';
import { useUser } from '@tet/api/users';
import { useCallback, useMemo } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY_PREFIX = 'tet_referentiel_table_columns_visibility';

// Ordre de présentation des colonnes dans le sélecteur de visibilité.
// Garde la colonne "Intitulé" toujours visible en l'excluant de cette liste.
export const REFERENTIEL_TABLE_COLUMN_OPTIONS = [
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
] as const satisfies readonly { id: string; label: string; default: boolean }[];

const AUDIT_COLUMN_OPTIONS = [
  { id: 'auditStatut', label: appLabels.auditColonneStatut, default: true },
  {
    id: 'auditOrdreDuJour',
    label: appLabels.auditColonneOrdreDuJour,
    default: true,
  },
  { id: 'auditNotes', label: appLabels.auditColonneNotes, default: true },
] as const satisfies readonly { id: string; label: string; default: boolean }[];

export type ReferentielTableColumnId =
  | (typeof REFERENTIEL_TABLE_COLUMN_OPTIONS)[number]['id']
  | (typeof AUDIT_COLUMN_OPTIONS)[number]['id'];

export type ReferentielTableColumnOption = {
  id: ReferentielTableColumnId;
  label: string;
  default: boolean;
};

export type ReferentielTableColumnVisibility = {
  columnVisibility: VisibilityState;
  visibleColumnIds: ReferentielTableColumnId[];
  setVisibleColumnIds: (ids: ReferentielTableColumnId[]) => void;
  columnOptions: ReferentielTableColumnOption[];
};

function getDefaultColumnVisibility(
  options: readonly ReferentielTableColumnOption[]
): VisibilityState {
  return Object.fromEntries(
    options.map(({ id, default: defaultValue }) => [id, defaultValue])
  );
}

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}

export function useReferentielTableColumnVisibility({
  showAuditRelatedColumns,
}: {
  showAuditRelatedColumns: boolean;
}): ReferentielTableColumnVisibility {
  const user = useUser();

  const columnOptions = useMemo<ReferentielTableColumnOption[]>(
    () =>
      showAuditRelatedColumns
        ? [...REFERENTIEL_TABLE_COLUMN_OPTIONS, ...AUDIT_COLUMN_OPTIONS]
        : [...REFERENTIEL_TABLE_COLUMN_OPTIONS],
    [showAuditRelatedColumns]
  );

  const [stored, setStored] = useLocalStorage<VisibilityState>(
    getStorageKey(user.id),
    getDefaultColumnVisibility(REFERENTIEL_TABLE_COLUMN_OPTIONS)
  );

  const columnVisibility: VisibilityState = {
    ...getDefaultColumnVisibility(columnOptions),
    ...(stored ?? {}),
  };

  // La colonne "statutDetaille" n'est pas exposée dans le sélecteur,
  // sa visibilité suit systématiquement celle de la colonne "statut".
  columnVisibility.statutDetaille = columnVisibility.statut !== false;

  const visibleColumnIds = columnOptions
    .filter(({ id }) => columnVisibility[id] !== false)
    .map(({ id }) => id);

  const setVisibleColumnIds = useCallback(
    (ids: ReferentielTableColumnId[]) => {
      const next = Object.fromEntries(
        columnOptions.map(({ id }) => [id, ids.includes(id)])
      );
      setStored({ ...(stored ?? {}), ...next });
    },
    [columnOptions, stored, setStored]
  );

  return {
    columnVisibility,
    visibleColumnIds,
    setVisibleColumnIds,
    columnOptions,
  };
}
