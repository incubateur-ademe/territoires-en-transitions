import { IndicateurDefinition } from '@/api/indicateurs/domain/definition.schema';
import { Button, HEAD_CELL_STYLE, Notification, TCell, Tooltip } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { SourceType } from '../types';
import { ConfirmDelete } from './confirm-delete';
import { PreparedData } from './prepare-data';
import { IndicateurSourceValeur } from './use-indicateur-valeurs';

type CellAnneeListProps = {
  confidentiel?: boolean;
  data: PreparedData;
  definition: IndicateurDefinition;
  readonly?: boolean;
  type: SourceType;
  onDelete: (valeur: IndicateurSourceValeur) => void;
};

/** Affiche les cellules des années dans l'en-tête du tableau */
export const CellAnneeList = ({
  confidentiel,
  data,
  definition,
  readonly,
  type,
  onDelete,
}: CellAnneeListProps) => {
  const { annees, anneeModePrive, valeursExistantes } = data;
  const [toBeDeleted, setToBeDeleted] = useState<IndicateurSourceValeur | null>(
    null
  );

  return annees?.map((annee) => {
    const valeur = valeursExistantes.find((v) => v.annee === annee);

    return (
      <TCell
        key={annee}
        className={classNames(
          HEAD_CELL_STYLE,
          'font-bold text-center relative min-w-40'
        )}
      >
        {confidentiel && type === 'resultat' && annee === anneeModePrive && (
          <ResultatModePrive />
        )}
        <div className="flex items-center justify-between">
          <span className="w-full">{annee}</span>
          {valeur && !readonly && (
            <Button
              className="!bg-transparent !border-none"
              icon="delete-bin-6-line"
              variant="outlined"
              size="xs"
              onClick={() => {
                // demande confirmation avant de supprimer
                if (
                  (valeur.objectif ?? false) ||
                  (valeur.resultat ?? false) ||
                  valeur.resultatCommentaire ||
                  valeur.objectifCommentaire
                ) {
                  setToBeDeleted(valeur);
                } else {
                  // sauf pour les lignes n'ayant ni valeur ni commentaire
                  onDelete(valeur);
                }
              }}
            />
          )}
        </div>
        {toBeDeleted && (
          <ConfirmDelete
            annee={annee}
            valeur={toBeDeleted}
            unite={definition.unite}
            onDismissConfirm={(confirmed) => {
              if (confirmed) {
                onDelete(toBeDeleted);
              }
              setToBeDeleted(null);
            }}
          />
        )}
      </TCell>
    );
  });
};

const ResultatModePrive = () => (
  <Tooltip label={<p className="min-w-max">Le résultat est en mode privé</p>}>
    <div className="absolute top-3 left-5">
      <Notification icon="lock-fill" classname="!h-10 w-10" />
    </div>
  </Tooltip>
);
