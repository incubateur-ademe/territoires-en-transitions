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
        className={classNames(
          'w-full flex items-center gap-3 py-3 px-6 hover:!bg-bf975',
          {
            'bg-indigo-100': isOpen,
          }
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <IconArrowSFill
          className={classNames({
            '-rotate-90': !isOpen,
          })}
        />
        <div className="w-12 h-12">{icon}</div>
        <span className="font-bold">{title}</span>
      </button>
      {isOpen && <div className="flex flex-col p-6">{children}</div>}
    </div>
  );
};

export default Section;
