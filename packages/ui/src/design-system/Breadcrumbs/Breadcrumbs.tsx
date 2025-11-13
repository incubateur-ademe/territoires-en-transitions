import classNames from 'classnames';
import { Button, ButtonSize } from '../Button';
import { Icon, IconSize } from '../Icon';

const buttonSizeToIconSize: Record<ButtonSize, IconSize> = {
  xs: 'sm',
  sm: 'md',
  md: 'lg',
  xl: '2xl',
};

type BreadcrumbsProps = {
  /** Liste d'items à afficher dans le fil d'ariane */
  items: {
    label: string;
    href?: string;
    onClick?: (index?: number) => void;
  }[];
  /** Taille des items */
  size?: ButtonSize;
  className?: string;
  /** Rend clickable le dernier élément */
  enableLastElementClick?: boolean;
};

/**
 * Fil d'ariane, avec liens ou boutons
 */
export const Breadcrumbs = ({
  items,
  size = 'md',
  className,
  enableLastElementClick,
}: BreadcrumbsProps) => {
  return (
    <div className={classNames('flex flex-wrap gap-x-1 gap-y-0.5', className)}>
      {items.map((button, index) => {
        const isClickable = button.onClick || button.href;

        const isLastElement = index === items.length - 1;

        const isLastAndNotClickableElement =
          isLastElement && !enableLastElementClick;

        const disabled = !isClickable || isLastAndNotClickableElement;

        return (
          <div
            key={button.label}
            className="flex items-center shrink-0 gap-x-1"
          >
            <Button
              disabled={disabled}
              className={classNames(
                'font-normal border-none hover:!pb-px text-left !text-grey-6 hover:!text-primary-9',
                {
                  'disabled:cursor-default disabled:!text-grey-6': disabled,
                  'disabled:!text-primary-9 !text-primary-9': isLastElement,
                }
              )}
              variant="underlined"
              size={size}
              onClick={() => button.onClick?.(index)}
              href={button.href}
            >
              {button.label}
            </Button>

            {/* Icône `>` entre chaque item */}
            {!isLastElement && (
              <Icon
                icon="arrow-right-s-line"
                size={buttonSizeToIconSize[size]}
                className="text-grey-8"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
