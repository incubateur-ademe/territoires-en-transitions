import { Select, MenuItem, FormControl, InputLabel } from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { useState } from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
    },
    selectEmpty: {
      marginTop: theme.spacing(2),
    },
  }),
);

export type Option<T extends string> = {
  value: T;
  label: string;
};

type SelectInputProps<T extends string> = {
  onChange: (selected: T) => void;
  options: Option<T>[];
  defaultValue: T;
  label: string;
};

export const SelectInput = <T extends string>({
  label,
  options,
  onChange,
  defaultValue,
}: SelectInputProps<T>) => {
  const classes = useStyles();
  const [value, setValue] = useState<T>(defaultValue);

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedValue = event.target.value as T;
    setValue(selectedValue);
    onChange(selectedValue);
  };

  return (
    <div>
      <FormControl className={classes.formControl}>
        <InputLabel>{label ?? ""}</InputLabel>
        <Select
          value={value}
          onChange={handleChange}
        >
          {options.map((option) => (
            <MenuItem value={option.value} key={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};
