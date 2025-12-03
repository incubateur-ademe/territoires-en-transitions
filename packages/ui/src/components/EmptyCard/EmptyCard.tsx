import classNames from 'classnames';
import React from 'react';
import { Badge, BadgeSize } from '../../design-system/Badge';
import { Button, ButtonProps, ButtonSize } from '../../design-system/Button';

type EmptyCardSize = 'xs' | 'md' | 'xl';

type PictoProps = {
  className: string;
  width: string;
  height: string;
};

const sizeClasses = {
  xs: {
    container: 'gap-4',
    title: 'text-lg leading-5',
    subtitle: 'text-sm leading-5',
    description: 'text-sm',
    badgeSize: 'sm' as BadgeSize,
    buttonSize: 'xs' as ButtonSize,
    picto: { width: '100px', height: '100px' },
  },
  md: {
    container: 'gap-4',
    title: 'text-2xl',
    subtitle: 'text-lg leading-6',
    description: 'text-lg',
    badgeSize: 'sm' as BadgeSize,
    buttonSize: 'xs' as ButtonSize,
    picto: { width: '100px', height: '100px' },
  },
  xl: {
    container: 'gap-5',
    title: 'text-3xl',
    subtitle: 'text-xl leading-7',
    description: 'text-lg',
    badgeSize: 'md' as BadgeSize,
    buttonSize: 'xl' as ButtonSize,
    picto: { width: '160px', height: '160px' },
  },
};

export type EmptyCardProps = {
  /** Pictogramme en en-tête de la carte */
  picto?: (props: PictoProps) => React.ReactNode;
  /** Titre de la carte */
  title?: string;
  /** Sous-titre de la carte */
  subTitle?: string;
  /** Texte descriptif, affiché sous le titre et le sous-titre */
  description?: string | string[];
  /** Liste de tags, affichés sous la description */
  tags?: string[];
  /** Conditionne le background et le border color de la carte */
  variant?: 'primary' | 'transparent';
  /** Conditionne la taille de la carte et de ses éléments */
  size?: EmptyCardSize;
  /** CTAs de la carte, liste de boutons ou d'objets ButtonProps  */
  actions?: (ButtonProps | React.ReactElement)[];
  /** Conditionne l'affichage des CTA */
  isReadonly?: boolean;
  /** Permet l'ajout de classNames custom */
  className?: string;
  /** Permet l'ajout d'un data-test id */
  dataTest?: string;
};

const Description = ({
  children,
  size,
}: {
  children: string | string[];
  size: EmptyCardSize;
}) => {
  return (
    <div
      className={classNames(
        'text-primary-9 text-center mb-0',
        sizeClasses[size].description
      )}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <span key={index} className="block">
              {child}
            </span>
          ))
        : children}
    </div>
  );
};

export const EmptyCard = ({
  picto,
  title,
  subTitle,
  description,
  tags,
  variant = 'primary',
  size = 'md',
  actions = [],
  isReadonly = false,
  className,
  dataTest,
}: EmptyCardProps) => {
  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center py-7 px-5 lg:py-8 lg:px-6 xl:py-10 xl:px-8 rounded-lg border',
        {
          'bg-primary-0 border-primary-4': variant === 'primary',
          'bg-transparent border-transparent': variant === 'transparent',
        },
        sizeClasses[size].container,
        className
      )}
      data-test={dataTest}
    >
      {/* Pictogramme */}
      {picto?.({
        className: 'mx-auto',
        width: sizeClasses[size].picto.width,
        height: sizeClasses[size].picto.height,
      })}

      <div
        className={classNames('flex flex-col gap-2', {
          hidden: !title && !subTitle && !description,
        })}
      >
        {/* Titre */}
        <h6
          className={classNames(
            'text-center mb-0',
            { hidden: !title },
            sizeClasses[size].title
          )}
        >
          {title}
        </h6>

        {/* Sous-titre */}
        <p
          className={classNames(
            'text-primary-7 font-normal text-center mb-0',
            { hidden: !subTitle },
            sizeClasses[size].subtitle
          )}
        >
          {subTitle}
        </p>

        {description && <Description size={size}>{description}</Description>}
      </div>

      {/* Liste de tags */}
      <div
        className={classNames('flex flex-wrap justify-center gap-2', {
          hidden: !tags || tags.length === 0,
        })}
      >
        {tags?.map((tag, index) => (
          <Badge
            key={index}
            title={tag}
            state="standard"
            size={sizeClasses[size].badgeSize}
            uppercase={false}
          />
        ))}
      </div>

      {/* Boutons */}
      {!isReadonly && (
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {React.isValidElement(action) ? (
                action
              ) : (
                <Button
                  size={sizeClasses[size].buttonSize}
                  {...(action as ButtonProps)}
                />
              )}
              {index % 2 !== 0 && index !== actions.length - 1 && (
                <div className="basis-full h-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
