import { getTetButtonClassnames } from '@tet/site/components/dstet/buttons/utils';
import classNames from 'classnames';
import './RadioAsButton.css';

type RadioAsButtonProps = {
  id: string;
  label: string;
  name: string;
  checked: boolean;
  onCheck: () => void;
};

const RadioAsButton = ({
  id,
  label,
  name,
  checked,
  onCheck,
}: RadioAsButtonProps) => {
  return (
    <div
      className={classNames(
        'button block relative !w-full h-[50px]',
        getTetButtonClassnames('outlined', 'big')
      )}
    >
      <input
        className="opacity-0 block absolute top-0 bottom-0 left-0 right-0"
        type="radio"
        id={id}
        value={id}
        name={name}
        checked={checked}
        onChange={onCheck}
      />
      <label
        className="block absolute top-0 bottom-0 left-0 right-0 w-full text-center leading-[50px] cursor-pointer hover:bg-primary-1 hover:text-primary-8 hover:border-primary-8 hover:rounded-[10px]"
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  );
};

export default RadioAsButton;
