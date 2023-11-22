import classNames from 'classnames';

type TCheckbox = {
  label: string;
  onCheck: () => void;
  checked: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
};

const Checkbox = ({
  label,
  checked,
  onCheck,
  disabled,
  className,
  labelClassName,
}: TCheckbox) => {
  return (
    <div
      className={classNames(
        'fr-checkbox-group fr-checkbox-group--sm',
        className
      )}
    >
      <input
        type="checkbox"
        id="checkbox"
        name="checkbox"
        className="!w-4"
        onChange={onCheck}
        checked={checked}
        disabled={disabled}
      />
      <label
        className={classNames('fr-label', labelClassName)}
        htmlFor="checkbox"
      >
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
