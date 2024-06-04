import classNames from 'classnames';
import {useState} from 'react';

type Props = {
  dataTest?: string;
  isDefaultOpen?: boolean;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  childrenContainerClassName?: string;
};

const Section = ({
  dataTest,
  isDefaultOpen,
  icon,
  title,
  children,
  childrenContainerClassName,
}: Props) => {
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
        <span
          className={classNames('h-6 fr-icon-arrow-right-s-fill text-bf500', {
            'rotate-90': isOpen,
          })}
        />
        <div className="w-12 h-12">{icon}</div>
        <span className="font-bold">{title}</span>
      </button>
      {isOpen && (
        <div
          className={classNames(
            'flex flex-col p-6',
            childrenContainerClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Section;
