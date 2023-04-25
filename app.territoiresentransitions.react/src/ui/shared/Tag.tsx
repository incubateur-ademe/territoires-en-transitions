import classNames from 'classnames';

type TTag = {
  title: string;
  onCloseClick?: () => void;
  className?: string;
  isUserCreated?: boolean;
};

const Tag = ({className, title, onCloseClick, isUserCreated}: TTag) => {
  if (!title || title.length === 0) {
    return null;
  }
  return (
    <div
      className={classNames(
        'group flex items-center px-4 py-1 bg-white border border-gray-300 text-gray-900 rounded-full',
        {'pr-2': onCloseClick},
        {
          '!text-white !bg-bf500': isUserCreated,
        },
        className
      )}
    >
      <span className="py-0.5 text-sm">{title}</span>
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
