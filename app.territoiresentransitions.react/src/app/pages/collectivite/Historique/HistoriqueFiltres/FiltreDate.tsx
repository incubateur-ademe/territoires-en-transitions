import {TFiltreProps} from '../filters';
import FilterField from 'ui/shared/filters/FilterField';

export const FiltreDateDebut = ({filters, setFilters}: TFiltreProps) => {
  return (
    <FilterField title="Date de début">
      <InputDate
        value={filters.startDate || ''}
        onChange={(newDate: string) =>
          setFilters({...filters, startDate: newDate})
        }
      />
    </FilterField>
  );
};

export const FiltreDateFin = ({filters, setFilters}: TFiltreProps) => {
  return (
    <FilterField title="Date de fin">
      <InputDate
        dataTest="filtre-end-date"
        value={filters.endDate || ''}
        onChange={(newDate: string) => {
          setFilters({...filters, endDate: newDate});
        }}
      />
    </FilterField>
  );
};

type InputDateProps = {
  dataTest?: string;
  value?: string;
  onChange: (date: string) => void;
};

const InputDate = ({dataTest, value, onChange}: InputDateProps) => (
  <input
    data-test={dataTest}
    type="date"
    className="w-full p-2"
    pattern="\d{4}-\d{2}-\d{2}"
    value={value}
    onChange={evt => {
      onChange(evt.target.value);
    }}
  />
);
