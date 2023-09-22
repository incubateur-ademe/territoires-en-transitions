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
    <div className="button block relative fr-btn fr-btn--secondary rounded-md h-fit w-full">
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
        className="block absolute top-0 bottom-0 left-0 right-0 w-full text-center leading-10 cursor-pointer hover:bg-[#f6f6f6] hover:rounded-md"
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  );
};

export default RadioAsButton;
