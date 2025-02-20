import { Button, ButtonSize } from '@/ui/design-system/Button';
import { Icon, IconSize } from '@/ui/design-system/Icon';
import classNames from 'classnames';

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
    onClick?: () => void;
  }[];
  /** Click détecté sur un des items, avec envoi de son index */
  onClick?: (index: number) => void;
  /** Taille des items */
  size?: ButtonSize;
  className?: string;
};

/**
 * Fil d'ariane, avec liens ou boutons
 */
export const Breadcrumbs = ({
  items,
  size = 'md',
  onClick,
  className,
}: BreadcrumbsProps) => {
  const readOnlyMode =
    items.filter((button) => button.href || button.onClick).length === 0 &&
    !onClick;

  return (
    <div className={classNames('flex flex-wrap gap-x-1 gap-y-0.5', className)}>
      {items.map((button, index) => {
        const isLastElement = index === items.length - 1;
        const isClickable = onClick || button.onClick || button.href;

        return (
          <div
            key={button.label}
            className="flex items-center shrink-0 gap-x-1"
          >
            <Button
              disabled={isLastElement && !readOnlyMode}
              className={classNames(
                'font-normal border-none hover:!pb-px text-left',
                {
                  '!cursor-default':
                    isLastElement || readOnlyMode || !isClickable,
                  '!text-primary-9': isLastElement && !readOnlyMode,
                  '!text-grey-6': !isLastElement || readOnlyMode,
                  'hover:!text-primary-9 transition':
                    !isLastElement && !readOnlyMode && isClickable,
                }
              )}
              variant="underlined"
              size={size}
              onClick={() => {
                onClick?.(index);
                button.onClick?.();
              }}
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
