import { Field, FormSection } from '@tet/ui';

import { splitPilotePersonnesAndUsers } from '@/app/collectivites/tags/personnes.utils';
import SelectPersonnesCombobox from '@/app/collectivites/tags/select-personnes.combobox';
import SelectServicesPilotesCombobox from '@/app/collectivites/tags/select-service-pilotes.combobox';
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
          <SelectPersonnesCombobox
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
          <SelectServicesPilotesCombobox
            values={filters?.servicePiloteIds}
            onChange={({ services }) => {
              setFilters({
                ...filters,
                servicePiloteIds: services.map((s) => s.id),
              });
            }}
          />
        </Field>
      </FormSection>
    </div>
  );
};

export default Filters;
