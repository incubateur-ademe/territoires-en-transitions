'use client';

import { cn } from '@tet/ui/utils/cn';
import { JSX, useRef, useState } from 'react';

import { uiLabels } from '../../labels/catalog';
import { InlineEditWrapper } from '../inline-edit';
import { TableCellTextarea } from '../table';

export const TITLE_MAX_LENGTH = 300;

const TitleLengthHint = ({
  currentLength,
}: {
  currentLength: number;
}): JSX.Element => (
  <span className="text-xs text-grey-6 px-4 py-1">
    {`${currentLength} / ${TITLE_MAX_LENGTH} caractères`}
  </span>
);

type EditableTitleProps = {
  className?: string;
  inputClassName?: string;
  title: string | null;
  isReadonly: boolean;
  onUpdate: (value: string | null) => void;
  placeholder?: string;
  dataTest?: string;
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
}: EditableTitleProps): JSX.Element => {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
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
          <TitleLengthHint currentLength={titleLength} />
        </div>
      )}
    >
      <h1
        data-test={dataTest}
        className={cn('mb-0 text-[2rem] leading-tight', className)}
      >
        {title || TITLE_FALLBACK}
      </h1>
    </InlineEditWrapper>
  );
};
