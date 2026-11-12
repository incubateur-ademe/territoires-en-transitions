import { appLabels } from '@/app/labels/catalog';
import ThematiquesDropdown from '@/app/shared/thematiques/thematiques.dropdown';
import { Alert, Button, ButtonMenu, Field } from '@tet/ui';

export const ThematiquesFilterButton = ({
  thematiqueIds,
  onChange,
  dataTest,
}: {
  thematiqueIds: number[];
  onChange: (thematiqueIds: number[]) => void;
  dataTest?: string;
}) => (
  <ButtonMenu
    icon="filter-line"
    variant="outlined"
    size="xs"
    className="h-8 py-1.5 gap-2 text-sm font-medium rounded-md"
    notification={thematiqueIds.length > 0 ? { number: 1 } : undefined}
    menu={{
      className: 'w-96 max-w-96',
      startContent: (
        <div className="flex flex-col gap-4 p-4">
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
      ),
    }}
  >
    {appLabels.filtrer}
  </ButtonMenu>
);
