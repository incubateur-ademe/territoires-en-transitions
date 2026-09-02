'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielDisplayMap } from '@tet/domain/collectivites';
import { ButtonMenu, Field } from '@tet/ui';
import { usePersonnalisationFilters } from './personnalisation-filters-context';
import { PersonnalisationThematiquesDropdown } from './personnalisation-thematiques.dropdown';
import { ReferentielsDropdown } from './referentiels.dropdown';

export function PersonnalisationFiltersMenu() {
  const currentCollectivite = useCurrentCollectivite();
  const { filters, setFilters, activeFiltersCount } =
    usePersonnalisationFilters();

  const { collectiviteId, collectivitePreferences } = currentCollectivite;
  const displayMap = getReferentielDisplayMap(
    collectivitePreferences.referentiels
  );
  // Un référentiel archivé reste visible dans la nav mais n'est pas
  // personnalisable : il n'est pas décompté ici (cf. ReferentielsDropdown).
  const enabledReferentielsCount = (
    Object.keys(displayMap) as (keyof typeof displayMap)[]
  ).filter(
    (id) =>
      displayMap[id] &&
      collectivitePreferences.referentiels[id]?.mode !== 'archived'
  ).length;

  return (
    <ButtonMenu
      icon="equalizer-line"
      variant="grey"
      size="xs"
      notification={
        activeFiltersCount > 0 ? { number: activeFiltersCount } : undefined
      }
      menu={{
        className: 'min-w-96',
        startContent: (
          <div className="flex flex-col gap-4 p-2 text-sm">
            {enabledReferentielsCount > 1 && (
              <Field title="Référentiels">
                <ReferentielsDropdown
                  values={filters.referentielIds}
                  onChange={(selectedReferentielIds) =>
                    setFilters({ referentielIds: selectedReferentielIds })
                  }
                />
              </Field>
            )}
            <Field title="Thématiques">
              <PersonnalisationThematiquesDropdown
                collectiviteId={collectiviteId}
                values={filters.thematiqueIds}
                onChange={(selectedThematiqueIds) =>
                  setFilters({ thematiqueIds: selectedThematiqueIds })
                }
              />
            </Field>
          </div>
        ),
      }}
    >
      {appLabels.filtrer}
    </ButtonMenu>
  );
}
