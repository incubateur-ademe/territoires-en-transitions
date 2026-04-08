'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ButtonMenu, Field } from '@tet/ui';
import { usePersonnalisationFilters } from './personnalisation-filters-context';
import { PersonnalisationThematiquesDropdown } from './personnalisation-thematiques.dropdown';
import { ReferentielsDropdown } from './referentiels.dropdown';

export function PersonnalisationFiltersMenu() {
  const currentCollectivite = useCurrentCollectivite();
  const { filters, setFilters, activeFiltersCount } =
    usePersonnalisationFilters();

  const { collectiviteId, collectivitePreferences } = currentCollectivite;
  const enabledReferentielsCount = Object.values(
    collectivitePreferences.referentiels.display
  ).filter((v) => !!v).length;

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
              <Field title="Référentiels" titleClassName="text-primary-9">
                <ReferentielsDropdown
                  values={filters.referentielIds}
                  onChange={(selectedReferentielIds) =>
                    setFilters({ referentielIds: selectedReferentielIds })
                  }
                />
              </Field>
            )}
            <Field title="Thématiques" titleClassName="text-primary-9">
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
      Filtrer
    </ButtonMenu>
  );
}
