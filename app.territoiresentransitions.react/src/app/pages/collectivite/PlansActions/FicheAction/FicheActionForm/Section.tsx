import classNames from 'classnames';
import {useState} from 'react';
import IconArrowSFill from 'ui/icons/IconArrowSFill';

type Props = {
  dataTest?: string;
  isDefaultOpen?: boolean;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

const Section = ({dataTest, isDefaultOpen, icon, title, children}: Props) => {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  return (
    <div className="rounded-lg border border-gray-300">
      <button
        data-test={dataTest}
        className={classNames('w-full flex items-center gap-3 py-4 px-6', {
          'bg-indigo-100': isOpen,
        })}
        onClick={() => setIsOpen(!isOpen)}
      >
        <IconArrowSFill
          className={classNames({
            '-rotate-90': !isOpen,
          })}
        />
        <div className="w-8 h-8">{icon}</div>
        <span className="font-bold">{title}</span>
      </button>
      {isOpen && <div className="flex flex-col p-6">{children}</div>}
    </div>
  );
};

export default Section;
