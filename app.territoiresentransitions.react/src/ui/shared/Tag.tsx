import classNames from 'classnames';

type TTag = {
  title: string;
  onCloseClick?: () => void;
  className?: string;
};

const Tag = ({className, title, onCloseClick}: TTag) => {
  return (
    <div
      className={classNames(
        'flex items-center px-4 py-1 text-white bg-bf500 rounded-full',
        {'pr-2': onCloseClick},
        className
      )}
    >
      <span className="text-sm">{title}</span>
      {onCloseClick && (
        <div
          className="ml-1 rounded-full cursor-pointer"
          onClick={evt => {
            evt.stopPropagation();
            onCloseClick();
          }}
        >
          <div className="fr-fi-close-line flex m-auto scale-75" />
        </div>
      )}
    </div>
  );
};

export default Tag;
