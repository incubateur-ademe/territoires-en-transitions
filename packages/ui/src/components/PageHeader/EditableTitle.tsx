'use client';

import { JSX, ReactNode, useId, useRef, useState } from 'react';

import { InlineEditWrapper } from '../../design-system/inline-edit';
import { TableCellTextarea } from '../../design-system/table';
import { uiLabels } from '../../labels/catalog';
import { cn } from '../../utils/cn';

export const TITLE_MAX_LENGTH = 300;

const TitleLengthHint = ({
  id,
  currentLength,
}: {
  id: string;
  currentLength: number;
}): JSX.Element => (
  <span id={id} aria-live="polite" className="text-xs text-grey-6 px-4 py-1">
    {uiLabels.caracteresSaisis({
      currentLength,
      maxLength: TITLE_MAX_LENGTH,
    })}
  </span>
);

export type EditableTitleProps = {
  className?: string;
  inputClassName?: string;
  title: string | null;
  isReadonly: boolean;
  onUpdate: (value: string | null) => void;
  placeholder?: string;
  dataTest?: string;
  suffix?: ReactNode;
  compact?: boolean;
  titleId?: string;
};

const TITLE_FALLBACK = uiLabels.sansTitre;

export const EditableTitle = ({
  className,
  inputClassName,
  title: initialTitle,
  placeholder = uiLabels.saisirUnTitre,
  isReadonly,
  onUpdate,
  dataTest,
  suffix,
  compact = false,
  titleId,
}: EditableTitleProps): JSX.Element => {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const hintId = useId();
  const valueAtOpenRef = useRef(initialTitle);
  const wasCancelledRef = useRef(false);

  const titleLength = (title ?? '').length;

  const handleEditingChange = (next: boolean): void => {
    if (next) {
      valueAtOpenRef.current = title;
      wasCancelledRef.current = false;
    }
    setIsEditing(next);
  };

  const handleClose = (): void => {
    if (wasCancelledRef.current) {
      wasCancelledRef.current = false;
      return;
    }
    onUpdate(title === null ? null : title.trim());
  };

  const displayTitle = title || TITLE_FALLBACK;

  return (
    <InlineEditWrapper
      floatingMatchReferenceHeight={false}
      disabled={isReadonly}
      openState={{ isOpen: isEditing, setIsOpen: handleEditingChange }}
      onClose={handleClose}
      renderOnEdit={({ openState }) => (
        <div className="flex flex-col gap-1">
          <TableCellTextarea
            dataTest={dataTest}
            aria-label={uiLabels.modifierLeTitre}
            aria-describedby={hintId}
            value={title ?? undefined}
            autoFocus
            onChange={(evt) =>
              setTitle(evt.target.value.slice(0, TITLE_MAX_LENGTH))
            }
            placeholder={placeholder}
            onBlur={() => openState.setIsOpen(false)}
            onKeyDown={(evt) => {
              if (evt.key === 'Enter') {
                openState.setIsOpen(false);
                return;
              }
              if (evt.key === 'Escape') {
                wasCancelledRef.current = true;
                setTitle(valueAtOpenRef.current);
              }
            }}
            className={inputClassName}
            rows={1}
          />
          <TitleLengthHint id={hintId} currentLength={titleLength} />
        </div>
      )}
    >
      <h1
        id={titleId}
        data-test={dataTest}
        className={cn(
          'mb-0 !leading-snug',
          compact ? 'text-xl' : 'text-2xl',
          className
        )}
      >
        {isReadonly ? (
          <>{displayTitle}</>
        ) : (
          <button
            type="button"
            aria-label={uiLabels.modifierLeTitre}
            aria-haspopup="dialog"
            aria-expanded={isEditing}
            className="text-left appearance-none bg-transparent p-0 border-0 m-0 font-inherit text-inherit cursor-text hover:text-primary-9"
          >
            {displayTitle}
          </button>
        )}
        {suffix}
      </h1>
    </InlineEditWrapper>
  );
};
