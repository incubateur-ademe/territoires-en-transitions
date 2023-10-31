import classNames from 'classnames';
import {Ref, forwardRef, useState} from 'react';
import IconCheck from 'ui/shared/designSystem/icons/IconCheck';

type Props = {
  isChecked?: boolean | null;
  onClick: () => void;
  description?: string;
  'data-test'?: string;
};

/** Boutton toggle avec description */
const ToggleButton = forwardRef(
  (
    {isChecked = false, description, onClick, 'data-test': dataTest}: Props,
    ref: Ref<HTMLButtonElement>
  ) => {
    const [checked, setChecked] = useState(isChecked);

    const handleClick = () => {
      onClick();
      setChecked(!checked);
    };

    return (
      <button
        data-test={dataTest}
        ref={ref}
        className="flex items-center gap-3 !bg-transparent"
        onClick={handleClick}
      >
        <div
          className={classNames('p-1 rounded-full bg-grey-4', {
            'bg-principale': checked,
          })}
        >
          <div className="w-8">
            <span
              className={classNames(
                'flex w-4 h-4 rounded-full bg-grey-1 transition',
                {
                  'translate-x-4': checked,
                }
              )}
            >
              {checked && (
                <IconCheck className="w-3 h-3 m-auto fill-principale" />
              )}
            </span>
          </div>
        </div>
        {description && <span className="text-grey-7">{description}</span>}
      </button>
    );
  }
);

export default ToggleButton;
