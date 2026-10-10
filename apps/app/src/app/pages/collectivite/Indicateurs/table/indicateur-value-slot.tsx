import { useCellEdit } from '@/app/indicateurs/valeurs/grid/use-cell-edit';
import { IndicateurValeurTypeBadge } from '@/app/indicateurs/valeurs/grid/indicateur-valeur-type.badge';
import { appLabels } from '@/app/labels/catalog';
import { Button, Field, FieldMessage, Icon, Input } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { useRef, useState } from 'react';
import type { SourceType } from '../types';

const numberFormat = new Intl.NumberFormat('fr', { maximumFractionDigits: 20 });

type Props = {
  type: SourceType;
  periodeLabel: string;
  value: number | null;
  readonly?: boolean;
  initiallyEditing?: boolean;
  onSave: (value: number | null) => Promise<boolean>;
  onClose?: () => void;
};

/** One result/objective slot; failed writes keep the draft open. */
export const IndicateurValueSlot = ({
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
  const label = capitalize(
    type === 'resultat'
      ? appLabels.indicateurResultat()
      : appLabels.indicateurObjectif()
  );
  const fieldLabel = appLabels.indicateurChampValeur(label, periodeLabel);
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
          <Input
            type="text"
            autoFocus
            aria-label={fieldLabel}
            aria-invalid={edit.status === 'error'}
            aria-busy={edit.status === 'saving'}
            inputMode="decimal"
            displaySize="sm"
            value={edit.text}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => edit.onChange(event.target.value)}
            onBlur={() => void save()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void save();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                canceled.current = true;
                edit.cancel();
                close();
              }
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
    <>
      <IndicateurValeurTypeBadge indicateurValeurType={type} />
      {value === null
        ? appLabels.indicateurValeurAbsente
        : numberFormat.format(value)}
    </>
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
        <>
          <IndicateurValeurTypeBadge indicateurValeurType={type} />
          <Icon icon="add-line" size="xs" />
          <span className="sr-only">
            {type === 'resultat'
              ? appLabels.indicateurAjouterResultat
              : appLabels.indicateurAjouterObjectif}
          </span>
        </>
      ) : (
        content
      )}
    </Button>
  );
};
