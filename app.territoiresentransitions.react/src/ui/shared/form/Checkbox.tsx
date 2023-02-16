type TCheckbox = {
  label: string;
  onCheck: () => void;
  checked: boolean;
  disabled?: boolean;
};

const Checkbox = ({label, checked, onCheck, disabled}: TCheckbox) => {
  return (
    <div className="fr-checkbox-group fr-checkbox-group--sm">
      <input
        type="checkbox"
        id="checkbox"
        name="checkbox"
        className="!w-4"
        onChange={onCheck}
        checked={checked}
        disabled={disabled}
      />
      <label className="fr-label !text-sm" htmlFor="checkbox">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
