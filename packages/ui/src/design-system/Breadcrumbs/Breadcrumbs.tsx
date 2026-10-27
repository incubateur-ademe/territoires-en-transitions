'use client';

import classNames from 'classnames';
import { useState } from 'react';
import { uiLabels } from '../../labels/catalog';
import { Button, ButtonSize } from '../Button';
import { Icon, IconSize } from '../Icon';

const buttonSizeToIconSize: Record<ButtonSize, IconSize> = {
  xs: 'sm',
  sm: 'md',
  md: 'lg',
  xl: '2xl',
};

const collapseButtonClassName =
  'rounded px-1.5 text-sm leading-5 bg-primary-2 text-primary-8 hover:bg-primary-3';

type BreadcrumbItem = {
  label: string;
  href?: string;
  onClick?: (index?: number) => void;
};

type BreadcrumbsProps = {
  /** Liste d'items à afficher dans le fil d'ariane */
  items: BreadcrumbItem[];
  /** Taille des items */
  size?: ButtonSize;
  className?: string;
  /** Rend clickable le dernier élément */
  enableLastElementClick?: boolean;
  /** Tronque les items trop longs avec des points de suspension */
  truncateItems?: boolean;
  collapseMiddleItems?: boolean;
};

/**
 * Fil d'ariane, avec liens ou boutons
 */
export const Breadcrumbs = ({
  items,
  size = 'md',
  className,
  enableLastElementClick,
  truncateItems,
  collapseMiddleItems,
}: BreadcrumbsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const canCollapse = Boolean(collapseMiddleItems) && items.length > 3;
  const isCollapsed = canCollapse && !isExpanded;
  const shouldTruncate = truncateItems && !(canCollapse && isExpanded);
  const lastIndex = items.length - 1;

  const separator = (
    <Icon
      icon="arrow-right-s-line"
      size={buttonSizeToIconSize[size]}
      className="text-grey-8"
    />
  );

  const renderItem = (button: BreadcrumbItem, index: number) => {
    const isClickable = button.onClick || button.href;

    const isLastElement = index === lastIndex;

    const isLastAndNotClickableElement =
      isLastElement && !enableLastElementClick;

    const disabled = !isClickable || isLastAndNotClickableElement;

    return (
      <div
        key={button.label}
        className={classNames('flex items-center gap-x-1', {
          'min-w-0 max-w-sm': shouldTruncate,
        })}
        title={shouldTruncate ? button.label : undefined}
      >
        <Button
          disabled={disabled}
          className={classNames(
            'font-normal border-none hover:!pb-px text-left !text-grey-6 hover:!text-primary-9',
            {
              'disabled:cursor-default disabled:!text-grey-6': disabled,
              'disabled:!text-primary-9 !text-primary-9': isLastElement,
              'min-w-0 max-w-full': shouldTruncate,
            }
          )}
          variant="underlined"
          size={size}
          onClick={() => button.onClick?.(index)}
          href={button.href}
        >
          {shouldTruncate ? (
            <span className="truncate">{button.label}</span>
          ) : (
            button.label
          )}
        </Button>

        {/* Icône `>` entre chaque item */}
        {!isLastElement && separator}
      </div>
    );
  };

  return (
    <div className={classNames('flex flex-wrap gap-x-1 gap-y-0.5', className)}>
      {isCollapsed ? (
        <>
          {renderItem(items[0], 0)}
          <div className="flex items-center gap-x-1">
            <button
              type="button"
              aria-expanded={false}
              aria-label={uiLabels.afficherNiveauxMasques({
                count: items.length - 2,
              })}
              onClick={() => setIsExpanded(true)}
              className={collapseButtonClassName}
            >
              {'…'}
            </button>
            {separator}
          </div>
          {renderItem(items[lastIndex], lastIndex)}
        </>
      ) : (
        items.map(renderItem)
      )}
      {canCollapse && isExpanded && (
        <button
          type="button"
          aria-expanded={true}
          onClick={() => setIsExpanded(false)}
          className={classNames(
            'ml-1 inline-flex items-center gap-0.5 self-center',
            collapseButtonClassName
          )}
        >
          <Icon icon="arrow-left-s-line" size="sm" />
          {uiLabels.reduire}
        </button>
      )}
    </div>
  );
};
