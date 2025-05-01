'use client';

import Markdown from '@/site/components/markdown/Markdown';
import { Button, ButtonVariant } from '@/ui';
import classNames from 'classnames';

type CardProps = {
  title?: string;
  subtitle?: string;
  step?: number | string;
  description: string;
  button?: {
    title: string;
    href: string;
    external?: boolean;
    variant?: ButtonVariant;
  };
  image?: React.ReactNode;
  imagePosition?: 'top' | 'left';
  className?: string;
  textClassName?: string;
  onClick?: () => void;
};

/**
 * Carte générique
 * Permet l'affichage d'un titre, d'un contenu, avec ou sans
 * image, step et bouton
 */

const Card = ({
  title,
  subtitle,
  step,
  description,
  button,
  image,
  imagePosition = 'top',
  className,
  textClassName,
  onClick,
}: CardProps) => {
  return (
    <div
      className={classNames(
        'bg-white p-4 md:p-6 xl:p-8 border border-primary-4 rounded-lg',
        {
          'grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8':
            !!image && imagePosition === 'left',
          'flex flex-col gap-6 xl:gap-8': !!image && imagePosition === 'top',
        },
        className
      )}
      onClick={onClick}
    >
      {!!image && <div className="overflow-hidden">{image}</div>}
      <div
        className={classNames('flex flex-col justify-between', {
          'col-span-2': !!image && imagePosition === 'left',
        })}
      >
        <div>
          {!!step && (
            <div className="w-[40px] h-[40px] rounded-full bg-primary-6 text-white text-center text-[22px] leading-[40px] font-bold mb-6">
              {step}
            </div>
          )}
          {!!title && <h4 className="text-primary-8 mb-3">{title}</h4>}
          {!!subtitle && (
            <p className="text-primary-9 text-[17px] leading-[24px] font-bold mb-3">
              {subtitle}
            </p>
          )}
          <Markdown
            texte={description}
            className={classNames(
              'paragraphe-16 markdown_style',
              textClassName
            )}
          />
        </div>

        {button && (
          <Button
            href={button.href}
            variant={button.variant}
            external={button.external}
            className="w-full justify-center"
          >
            {button.title}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Card;
