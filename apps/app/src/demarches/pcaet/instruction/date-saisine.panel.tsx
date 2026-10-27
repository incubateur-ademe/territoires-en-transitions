'use client';

import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { getDateCivileFrance } from '@tet/domain/demarches';
import { Button, Field, Input } from '@tet/ui';
import { useState } from 'react';
import { useAddDateSaisine } from './data/use-add-date-saisine';
import { useListDatesSaisine } from './data/use-list-dates-saisine';

const NB_DATES_HISTORIQUE = 3;

export const DateSaisinePanel = ({
  demandeAvisId,
  dateSaisine,
  onSaved,
}: {
  demandeAvisId: number;
  dateSaisine: string | null;
  onSaved: () => void;
}) => {
  const fieldId = `instruction-date-saisine-${demandeAvisId}`;
  const [date, setDate] = useState(dateSaisine ?? '');
  const { mutate: addDateSaisine, isPending } = useAddDateSaisine();
  const { data: historique = [] } = useListDatesSaisine(demandeAvisId);

  const enregistrer = () => {
    if (!date) return;
    addDateSaisine({ demandeAvisId, dateSaisine: date }, { onSuccess: onSaved });
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      <Field title={appLabels.instructionListeColonneDateSaisine} htmlFor={fieldId}>
        <div className="flex items-center gap-2">
          <Input
            id={fieldId}
            type="date"
            min="1900-01-01"
            max={getDateCivileFrance(new Date())}
            value={date}
            displaySize="sm"
            onChange={(event) => setDate(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                enregistrer();
              }
            }}
            containerClassname="grow"
            data-test="demarches.pcaet.instruction.date-saisine-input"
          />
          <Button
            size="sm"
            disabled={!date || isPending}
            onClick={enregistrer}
            data-test="demarches.pcaet.instruction.date-saisine-enregistrer"
          >
            {appLabels.enregistrer}
          </Button>
        </div>
      </Field>
      {historique.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-grey-3 pt-3">
          <span className="text-xs font-bold uppercase text-grey-8">
            {appLabels.instructionDateSaisineHistorique}
          </span>
          <ol className="m-0 flex list-none flex-col gap-1 p-0">
            {historique.slice(0, NB_DATES_HISTORIQUE).map((ligne, index) => (
              <li
                key={`${ligne.createdAt}-${index}`}
                className="flex flex-col p-0 text-sm"
              >
                <span
                  className={index === 0 ? 'font-bold text-primary-9' : 'text-primary-9'}
                >
                  {getTextFormattedDate({ date: ligne.dateSaisine })}
                </span>
                <span className="text-xs text-grey-7">
                  {appLabels.instructionDateSaisineSaisiePar({
                    date: getTextFormattedDate({ date: ligne.createdAt }),
                    nom: ligne.createdByNom,
                  })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
