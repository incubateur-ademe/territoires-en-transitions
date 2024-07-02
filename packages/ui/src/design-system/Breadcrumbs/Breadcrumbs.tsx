import {Button, ButtonSize} from '@design-system/Button';
import {Icon, IconSize} from '@design-system/Icon';
import classNames from 'classnames';

const buttonSizeToIconSize: Record<ButtonSize, IconSize> = {
  xs: 'sm',
  sm: 'md',
  md: 'lg',
  xl: '2xl',
};

type BreadcrumbsProps = {
  /** Liste des boutons à afficher dans le fil d'ariane */
  buttons?: {
    label: string;
    href?: string;
    onClick?: () => void;
  }[];
  /** Click détecté sur un des boutons, avec envoi de son index */
  onClick?: (index: number) => void;
  /** Taille des boutons */
  size?: ButtonSize;
};

/**
 * Fil d'ariane, avec liens ou boutons
 */
export const Breadcrumbs = ({
  buttons,
  size = 'md',
  onClick,
}: BreadcrumbsProps) => {
  const readOnlyMode =
    buttons.filter(button => button.href || button.onClick).length === 0 &&
    !onClick;

  return (
    <div className="flex flex-wrap gap-x-1 gap-y-0.5">
      {(buttons ?? []).map((button, index) => {
        const isLastElement = index === buttons.length - 1;

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
                  '!cursor-default': isLastElement || readOnlyMode,
                  '!text-primary-9': isLastElement && !readOnlyMode,
                  '!text-grey-6': !isLastElement || readOnlyMode,
                  'hover:!text-primary-9 transition':
                    !isLastElement && !readOnlyMode,
                }
              )}
              variant="underlined"
              size={size}
              onClick={() => {
                onClick(index);
                button.onClick();
              }}
              href={button.href}
            >
              {button.label}
            </Button>

            {/* Icône `>` entre chaque bouton */}
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
