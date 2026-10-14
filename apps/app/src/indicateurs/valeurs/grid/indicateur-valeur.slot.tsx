'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, cn, Field, FieldMessage, Icon } from '@tet/ui';
import { useEffect, useRef } from 'react';
import type { IndicateurValeurField } from './types';
import {
  getIndicateurValeurFieldLabel,
  IndicateurValeurContent,
  IndicateurValeurInput,
} from './indicateur-valeur.field';
import type { CellEdit } from './use-cell-edit';

const numberFormat = new Intl.NumberFormat('fr', { maximumFractionDigits: 20 });

type Props = {
  type: IndicateurValeurField;
  periodeLabel: string;
  value: number | null;
  readonly?: boolean;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
  edit: CellEdit;
};

/** One result/objective slot; failed writes keep the draft open. */
export const IndicateurValeurSlot = ({
  type,
  periodeLabel,
  value,
  readonly,
  isEditing,
  onEditingChange,
  edit,
}: Props) => {
  const canceled = useRef(false);
  const editingSession = useRef(0);
  useEffect(() => {
    // The empty-cell menu can reopen this mounted slot without clicking its button.
    if (isEditing) canceled.current = false;
  }, [isEditing]);
  const fieldLabel = getIndicateurValeurFieldLabel(type, periodeLabel);
  const close = () => {
    canceled.current = true;
    editingSession.current += 1;
    onEditingChange(false);
  };
  const save = async () => {
    const session = editingSession.current;
    if (
      !canceled.current &&
      (await edit.save()) &&
      session === editingSession.current
    ) {
      close();
    }
  };

  const content =
    value === null ? null : (
      <IndicateurValeurContent type={type} className="gap-1 text-base">
        {numberFormat.format(value)}
      </IndicateurValeurContent>
    );
  if (readonly)
    return value === null ? null : (
      <span className="inline-flex items-center gap-1" aria-label={fieldLabel}>
        {content}
      </span>
    );
  return (
    <div className="min-w-24">
      <div className="relative">
        {/* Keep the displayed value's dimensions while the input overlays it. */}
        <Button
          size="xs"
          variant="white"
          className={cn(
            'h-10 min-w-full font-normal !border-transparent whitespace-nowrap',
            isEditing && 'invisible'
          )}
          title={fieldLabel}
          aria-label={fieldLabel}
          data-test={`indicateurs.valeurs.${type}.edit`}
          onClick={() => onEditingChange(true)}
        >
          {value === null ? (
            <IndicateurValeurContent type={type} className="gap-1 text-base">
              <Icon icon="add-line" size="xs" />
              <span className="sr-only">
                {type === 'resultat'
                  ? appLabels.indicateurAjouterResultat
                  : appLabels.indicateurAjouterObjectif}
              </span>
            </IndicateurValeurContent>
          ) : (
            content
          )}
        </Button>
        {isEditing && (
          <Field className="absolute inset-0">
            <IndicateurValeurInput
              type={type}
              periodeLabel={periodeLabel}
              edit={edit}
              inputType="text"
              containerClassname="h-10"
              className="min-w-0 w-full"
              displaySize="sm"
              onBlur={() => void save()}
              onCommit={() => void save()}
              onCancel={close}
              data-test={`indicateurs.valeurs.${type}.input`}
            />
          </Field>
        )}
      </div>
      {isEditing && edit.error && (
        <FieldMessage
          state="error"
          message={
            edit.error === 'invalid'
              ? appLabels.champValeurInvalideErreur
              : appLabels.mutationError
          }
        />
      )}
    </div>
  );
};
