import { makeStyles, TextField } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import { Autocomplete } from "@material-ui/lab";

type Option<T extends string> = {
  value: T;
  label: string;
};

type UiSelectProps<T extends string> = {
  onChange: (
    // event: React.ChangeEvent<{
    //   name?: string | undefined;
    // }>,
    selected: string | Option<T> | null,
  ) => void;
  options: Option<T>[];
  label: string;
};

const useStyle = makeStyles({
  formControl: {
    margin: 5,
    minWidth: 200,
  },
});

export const UiSelect = <T extends string>({
  onChange,
  options,
  label,
}: UiSelectProps<T>) => {
  const classes = useStyle();

  return (
    <FormControl className={classes.formControl}>
      <Autocomplete
        freeSolo
        options={options}
        getOptionLabel={(option) => option.label ?? ""}
        onChange={(event, value) => {
          onChange(value);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            margin="normal"
            variant="outlined"
            autoFocus
          />
        )}
      />
    </FormControl>
  );
};
