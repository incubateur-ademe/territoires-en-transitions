import { Field, FormSection } from '@tet/ui';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { splitPilotePersonnesAndUsers } from '@/app/collectivites/tags/personnes.utils';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { ActionListFilters } from '@/app/referentiels/actions/use-list-actions';

type Props = {
  filters: ActionListFilters;
  setFilters: (filters: ActionListFilters) => void;
};

const Filters = ({ filters, setFilters }: Props) => {
  const pilotes = [];
  if (filters?.utilisateurPiloteIds) {
    pilotes.push(...filters.utilisateurPiloteIds);
  }
  if (filters?.personnePiloteIds) {
    pilotes.push(...filters.personnePiloteIds.map(String));
  }

  return (
    <div className="w-full sm:w-[28rem] lg:gap-12 p-4 lg:p-8">
      <FormSection title="Filtrer :" className="!grid-cols-1">
        <Field title="Personne pilote :">
          <PersonneTagDropdown
            values={pilotes.length ? pilotes : undefined}
            onChange={({ personnes }) => {
              setFilters({
                ...filters,
                ...splitPilotePersonnesAndUsers(personnes),
              });
            }}
          />
        </Field>
        <Field title="Direction ou service pilote :">
          <ServiceTagDropdown
            values={filters?.servicePiloteIds}
            onChange={({ values }) => {
              setFilters({
                ...filters,
                servicePiloteIds: values.map((s) => s.id),
              });
            }}
          />
        </Field>
      </FormSection>
    </div>
  );
};

export default Filters;
