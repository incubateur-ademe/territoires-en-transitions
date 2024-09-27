import {Button, IconValue} from '@tet/ui';
import classNames from 'classnames';

type EmptyCardProps = {
  picto: (className: string) => React.ReactNode;
  title: string;
  subTitle?: string;
  isReadonly?: boolean;
  action: {
    label: string;
    onClick: () => void;
    icon?: IconValue;
    dataTest?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: IconValue;
  };
  className?: string;
  dataTest?: string;
};

const EmptyCard = ({
  picto,
  title,
  subTitle,
  isReadonly = false,
  action,
  secondaryAction,
  className,
  dataTest,
}: EmptyCardProps) => {
  return (
    <div
      className={classNames(
        'bg-primary-0 border border-primary-4 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col items-center justify-center gap-3',
        className
      )}
      data-test={dataTest}
    >
      {/* Pictogramme */}
      {picto('mx-auto')}
      {/* Titre */}
      <h6 className="text-lg leading-5 text-center text-primary-8 mb-0 px-2">
        {title}
      </h6>
      {/* Sous-Titre */}
      {!!subTitle && (
        <p className="text-base text-primary-9 text-center mb-0">{subTitle}</p>
      )}
      {/* Appels à l'action */}
      {!isReadonly && (
        <div className="flex justify-center items-center gap-4 mt-3">
          {secondaryAction && (
            <Button
              size="xs"
              variant="outlined"
              icon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            size="xs"
            icon={action.icon}
            onClick={action.onClick}
            data-test={action.dataTest}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyCard;
