import { Select, SelectProps } from '@/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  trueLabel: string;
  falseLabel: string;
  values?: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
};

const SelectWithTrueFalseUndefinedValueDropdown = ({
  trueLabel,
  falseLabel,
  values,
  onChange,
}: Props) => {
  return (
    <Select
      values={
        values === undefined ? undefined : values ? trueLabel : falseLabel
      }
      dataTest={'mesuresLiees'}
      options={[
        {
          value: trueLabel,
          label: trueLabel,
        },
        {
          label: falseLabel,
          value: falseLabel,
        },
      ]}
      onChange={(value) => {
        onChange(value ? (value === trueLabel ? true : false) : undefined);
      }}
    />
  );
};

export default SelectWithTrueFalseUndefinedValueDropdown;
