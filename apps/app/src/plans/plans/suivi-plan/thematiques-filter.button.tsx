import { appLabels } from '@/app/labels/catalog';
import ThematiquesDropdown from '@/app/shared/thematiques/thematiques.dropdown';
import { FiltersGenericButtonMenu } from '@/app/ui/lists/filters.generic-button-menu';
import { Alert, Button, Field } from '@tet/ui';

export const ThematiquesFilterButton = ({
  thematiqueIds,
  onChange,
  dataTest,
}: {
  thematiqueIds: number[];
  onChange: (thematiqueIds: number[]) => void;
  dataTest?: string;
}) => (
  <FiltersGenericButtonMenu
    activeFiltersCount={thematiqueIds.length > 0 ? 1 : 0}
    menuClassName="w-96 max-w-96"
  >
    <div className="flex flex-col gap-4">
      <Alert title={appLabels.suiviPlanFiltresBloc} />
      <Field title={appLabels.suiviPlanThematiques}>
        <ThematiquesDropdown
          values={thematiqueIds}
          onChange={onChange}
          dataTest={dataTest}
        />
      </Field>
      <Button
        variant="underlined"
        size="xs"
        className="self-end"
        disabled={thematiqueIds.length === 0}
        onClick={() => onChange([])}
      >
        {appLabels.suiviPlanReinitialiserFiltres}
      </Button>
    </div>
  </FiltersGenericButtonMenu>
);
