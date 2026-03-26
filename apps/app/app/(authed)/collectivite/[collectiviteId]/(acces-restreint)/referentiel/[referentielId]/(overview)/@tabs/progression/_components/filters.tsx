import { Field, FormSection } from '@tet/ui';

import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { splitPilotePersonnesAndUsers } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import { ListActionsInput } from '@tet/domain/referentiels';

type Props = {
  filters: ListActionsInput;
  setFilters: (filters: ListActionsInput) => void;
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
          <PersonnesDropdown
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
          <ServicesPilotesDropdown
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
