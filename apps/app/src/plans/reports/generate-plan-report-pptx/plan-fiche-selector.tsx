import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { FicheWithRelations } from '@tet/domain/plans';
import { ITEM_ALL, Option, OptionSection, SelectMultiple } from '@tet/ui';

type PlanFicheSelectorProps = {
  collectiviteId: number;
  planId: number;
  values?: (number | string)[];
  onChange: (args: {
    selectedValue: number | string;
    values?: (number | string)[];
  }) => void;
  disabled?: boolean;
};

const DEFAULT_TITRE_FICHE = 'Action sans titre';
const NO_AXE_NOM = 'Sans axe';
const sortOptions: Intl.CollatorOptions = {
  sensitivity: 'base',
  numeric: true,
};

const getFichesWithAxesSections = (
  planId: number,
  fiches?: FicheWithRelations[],
  hasSelectedValues?: boolean
): (OptionSection | Option)[] => {
  if (!fiches || fiches.length === 0) {
    return [];
  }

  const axesMap = fiches.reduce<{
    [key: number]: OptionSection & { id: number };
  }>((acc, fiche) => {
    const mainAxe = fiche.axes?.find((axe) => axe.parentId === planId) || {
      id: -1,
      nom: NO_AXE_NOM,
    };
    if (!acc[mainAxe.id]) {
      acc[mainAxe.id] = {
        id: mainAxe.id,
        title: mainAxe.nom,
        options: [],
      };
    }
    acc[mainAxe.id].options.push({
      value: fiche.id,
      label: fiche.titre ?? DEFAULT_TITRE_FICHE,
    });
    return acc;
  }, {});

  const sortedAxeSections = Object.values(axesMap).sort((a, b) => {
    // Put "Sans axe" at the end
    if (a.id === -1) return 1;
    if (b.id === -1) return -1;
    return a.title.localeCompare(b.title, undefined, sortOptions);
  });

  const itemAllOption = {
    label: hasSelectedValues
      ? 'Désélectionner toutes les actions'
      : 'Sélectionner toutes les actions',
    value: ITEM_ALL,
  };
  return [itemAllOption, ...sortedAxeSections];
};

export function PlanFicheSelector({
  collectiviteId,
  planId,
  values,
  onChange,
  disabled,
}: PlanFicheSelectorProps) {
  const { fiches, isLoading } = useListFiches(collectiviteId, {
    filters: {
      planActionIds: [planId],
      withAxesAncestors: true,
    },
    queryOptions: {
      limit: 'all',
      sort: [{ field: 'titre', direction: 'asc' }],
      
    },
  });

  const options = getFichesWithAxesSections(
    planId,
    fiches,
    Boolean(values?.length)
  );

  return (
    <SelectMultiple
      options={options}
      values={values}
      isSearcheable
      multiple={true}
      onChange={(args) => {
        if (args.selectedValue === ITEM_ALL) {
          if (!values?.length) {
            onChange({
              selectedValue: ITEM_ALL,
              values: fiches.map((fiche) => fiche.id),
            });
          } else {
            onChange({ selectedValue: ITEM_ALL });
          }
        } else {
          onChange(args);
        }
      }}
      disabled={disabled}
      isLoading={isLoading}
      placeholder={isLoading ? 'Chargement...' : 'Sélectionner des actions'}
    />
  );
}
