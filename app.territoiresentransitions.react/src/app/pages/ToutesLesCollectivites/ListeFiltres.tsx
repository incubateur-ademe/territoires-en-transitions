import {useRegions} from 'app/pages/ToutesLesCollectivites/hooks';
import {
  Checkbox,
  FormControl,
  Input,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
} from '@material-ui/core';
import {SelectInputProps} from '@material-ui/core/Select/SelectInput';

/**
 * Permet de sélectionner une région
 */
export const RegionFiltre = (props: {
  codes: string[];
  updateCodes: (newFilters: string[]) => void;
}) => {
  const regions = useRegions();
  const {codes, updateCodes} = props;

  const handleChange: SelectInputProps['onChange'] = event => {
    const selection = event.target.value as string[];
    console.log('event', selection);
    updateCodes(selection);
  };

  return (
    <FormControl>
      <InputLabel id="demo-mutiple-checkbox-label">Région {codes}</InputLabel>
      <Select
        labelId="demo-mutiple-checkbox-label"
        id="demo-mutiple-checkbox"
        multiple
        value={codes}
        onChange={handleChange}
        renderValue={selected => {
          const codes = selected as string[];
          return (
            <span>
              {regions
                .filter(r => codes.includes(r.code))
                .map(r => r.libelle)
                .join(',')}
            </span>
          );
        }}
        input={<Input />}
      >
        {regions.map(region => (
          <MenuItem key={region.code} value={region.code}>
            <Checkbox checked={codes.includes(region.code)} />
            <ListItemText primary={region.libelle} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
