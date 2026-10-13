'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Field, FieldMessage, Icon } from '@tet/ui';
import { useRef } from 'react';
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

  if (isEditing && !readonly) {
    return (
      <div className="min-w-24 grow">
        <Field>
          <IndicateurValeurInput
            type={type}
            periodeLabel={periodeLabel}
            edit={edit}
            inputType="text"
            containerClassname=""
            displaySize="sm"
            onBlur={() => void save()}
            onCommit={() => void save()}
            onCancel={close}
            data-test={`indicateurs.valeurs.${type}.input`}
          />
        </Field>
        {edit.error && (
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
  }
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
    <Button
      size="xs"
      variant="white"
      className="font-normal !border-transparent whitespace-nowrap"
      title={fieldLabel}
      aria-label={fieldLabel}
      data-test={`indicateurs.valeurs.${type}.edit`}
      onClick={() => {
        canceled.current = false;
        onEditingChange(true);
      }}
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
  );
};
