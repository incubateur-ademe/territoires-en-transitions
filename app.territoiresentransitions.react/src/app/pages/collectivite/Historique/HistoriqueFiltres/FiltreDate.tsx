import HistoriqueFiltreField from './HistoriqueFiltreField';

import {TFiltreProps} from '../filters';

export const FiltreDateDebut = ({filters, setFilters}: TFiltreProps) => {
  return (
    <HistoriqueFiltreField title="Date de début">
      <InputDate
        value={filters.startDate || ''}
        onChange={(newDate: string) =>
          setFilters({...filters, startDate: newDate})
        }
      />
    </HistoriqueFiltreField>
  );
};

export const FiltreDateFin = ({filters, setFilters}: TFiltreProps) => {
  return (
    <HistoriqueFiltreField title="Date de fin">
      <InputDate
        dataTest="filtre-end-date"
        value={filters.endDate || ''}
        onChange={(newDate: string) => {
          setFilters({...filters, endDate: newDate});
        }}
      />
    </HistoriqueFiltreField>
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
