import { Button, ButtonProps, ButtonSize } from '@/ui';
import classNames from 'classnames';

type EmptyCardSize = 'xs' | 'md' | 'xl';

type EmptyCardProps = {
  picto: (props: {
    className?: string;
    width?: string;
    height?: string;
  }) => React.ReactNode;
  title: string;
  subTitle?: string;
  description?: string;
  additionalContent?: React.ReactNode;
  isReadonly?: boolean;
  actions?: ButtonProps[];
  className?: string;
  dataTest?: string;
  background?: 'bg-primary-0' | 'bg-transparent';
  border?: 'border-primary-4' | 'border-transparent';
  size?: EmptyCardSize;
};

export const EmptyCard = ({
  picto,
  title,
  subTitle,
  description,
  additionalContent,
  isReadonly = false,
  actions = [],
  className,
  dataTest,
  background = 'bg-primary-0',
  border = 'border-primary-4',
  size = 'md',
}: EmptyCardProps) => {
  const sizeClasses = {
    xs: {
      container: 'py-4 px-4 gap-2',
      title: 'text-lg',
      subtitle: 'text-sm',
      description: 'text-sm',
      buttonSize: 'xs' as ButtonSize,
      actionsContainer: 'mt-2 gap-2',
      picto: { width: '100px', height: '100px' },
    },
    md: {
      container: 'py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 gap-3',
      title: 'text-2xl',
      subtitle: 'text-lg',
      description: 'text-lg',
      buttonSize: 'md' as ButtonSize,
      actionsContainer: 'mt-3 gap-4',
      picto: { width: '100px', height: '100px' },
    },
    xl: {
      container: 'py-10 lg:py-12 xl:py-14 px-6 lg:px-8 xl:px-10 gap-4',
      title: 'text-3xl',
      subtitle: 'text-xl',
      description: 'text-lg',
      buttonSize: 'xl' as ButtonSize,
      actionsContainer: 'mt-4 gap-4',
      picto: { width: '160px', height: '160px' },
    },
  };

  return (
    <div
      className={classNames(
        `${background} border ${border} rounded-lg flex flex-col items-center justify-center`,
        sizeClasses[size].container,
        className
      )}
      data-test={dataTest}
    >
      {picto({
        className: 'mx-auto',
        width: sizeClasses[size].picto.width,
        height: sizeClasses[size].picto.height,
      })}
      <h6
        className={classNames(
          'leading-5 text-center text-primary-8 mb-0 px-2',
          sizeClasses[size].title
        )}
      >
        {title}
      </h6>
      {!!subTitle && (
        <p
          className={classNames(
            'text-primary-9 text-center mb-0',
            sizeClasses[size].subtitle
          )}
        >
          {subTitle}
        </p>
      )}
      {!!description && (
        <p
          className={classNames(
            'text-primary-9 text-center mb-0 w-[70%]',
            sizeClasses[size].description
          )}
        >
          {description}
        </p>
      )}
      {!!additionalContent && additionalContent}
      {!isReadonly && (
        <div
          className={classNames(
            'flex justify-center items-center',
            sizeClasses[size].actionsContainer
          )}
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              size={sizeClasses[size].buttonSize}
              {...action}
            />
          ))}
        </div>
      )}
    </div>
  );
};
