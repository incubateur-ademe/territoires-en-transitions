import { appLabels } from '@/app/labels/catalog';
import { Field, Input, Tooltip } from '@tet/ui';
import { useId, useState } from 'react';
import { ConfirmChangeUnite } from './confirm-change-unite';

type Props = {
  titre: string;
  unite: string;
  hasSousIndicateurs: boolean;
  disabled?: boolean;
  parentTitre?: string;
  updateUnite: (value: string) => void;
};

export const IndicateurUniteInput = ({
  titre,
  unite,
  hasSousIndicateurs,
  disabled,
  parentTitre,
  updateUnite,
}: Props) => {
  const [uniteInput, setUniteInput] = useState(unite);
  const [uniteReceived, setUniteReceived] = useState(unite);
  if (unite !== uniteReceived) {
    setUniteReceived(unite);
    setUniteInput(unite);
  }
  const [uniteToConfirm, setUniteToConfirm] = useState<string | null>(null);
  const inputId = useId();
  const descriptionId = useId();
  const isInheritedFromParent = parentTitre !== undefined;
  const uniteDuParent = isInheritedFromParent
    ? appLabels.indicateurUniteDuParent({ parent: parentTitre })
    : undefined;

  const saveUnite = (value: string): void => {
    if (hasSousIndicateurs && value !== unite) {
      setUniteToConfirm(value);
      return;
    }
    updateUnite(value);
  };

  return (
    <>
      <Field
        title={appLabels.indicateurUnite}
        htmlFor={inputId}
        className="max-w-72"
        small
      >
        <Tooltip label={uniteDuParent}>
          <div className="flex flex-col">
            <Input
              id={inputId}
              type="text"
              displaySize="sm"
              value={uniteInput}
              onChange={(evt) => setUniteInput(evt.target.value)}
              onBlur={(evt) => saveUnite(evt.target.value)}
              disabled={disabled || isInheritedFromParent}
              aria-describedby={
                uniteDuParent === undefined ? undefined : descriptionId
              }
            />
            {uniteDuParent !== undefined && (
              <span id={descriptionId} className="sr-only">
                {uniteDuParent}
              </span>
            )}
          </div>
        </Tooltip>
      </Field>
      {uniteToConfirm !== null && (
        <ConfirmChangeUnite
          titre={titre}
          onDismissConfirm={(isConfirmed) => {
            if (isConfirmed) {
              updateUnite(uniteToConfirm);
            } else {
              setUniteInput(unite);
            }
            setUniteToConfirm(null);
          }}
        />
      )}
    </>
  );
};
