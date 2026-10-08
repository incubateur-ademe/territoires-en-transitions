'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Field, FieldMessage, Icon } from '@tet/ui';
import { useRef, useState } from 'react';
import type { IndicateurValeurField } from './types';
import {
  getIndicateurValeurFieldLabel,
  IndicateurValeurContent,
  IndicateurValeurInput,
} from './indicateur-valeur.field';
import { useCellEdit } from './use-cell-edit';

const numberFormat = new Intl.NumberFormat('fr', { maximumFractionDigits: 20 });

type Props = {
  type: IndicateurValeurField;
  periodeLabel: string;
  value: number | null;
  readonly?: boolean;
  initiallyEditing?: boolean;
  onSave: (value: number | null) => Promise<boolean>;
  onClose?: () => void;
};

/** One result/objective slot; failed writes keep the draft open. */
export const IndicateurValeurSlot = ({
  type,
  periodeLabel,
  value,
  readonly,
  initiallyEditing,
  onSave,
  onClose,
}: Props) => {
  const [isEditing, setIsEditing] = useState(initiallyEditing ?? false);
  const canceled = useRef(false);
  const edit = useCellEdit({ currentValue: value, onSave });
  const fieldLabel = getIndicateurValeurFieldLabel(type, periodeLabel);
  const close = () => {
    setIsEditing(false);
    onClose?.();
  };
  const save = async () => {
    if (!canceled.current && (await edit.save())) close();
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
            onCancel={() => {
              canceled.current = true;
              close();
            }}
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
  const content = (
    <IndicateurValeurContent type={type} className="gap-1">
      {value === null
        ? appLabels.indicateurValeurAbsente
        : numberFormat.format(value)}
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
        setIsEditing(true);
      }}
    >
      {value === null ? (
        <IndicateurValeurContent type={type} className="gap-1">
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
