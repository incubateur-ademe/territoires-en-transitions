import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import {
  formatIndicateurPeriod,
  IndicateurPeriods,
  type IndicateurPeriod,
} from '@tet/domain/indicateurs';
import {
  Button,
  ButtonMenu,
  Icon,
  Table,
  TableCell,
  TableHeaderCell,
  Tooltip,
} from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { useState, type ReactNode } from 'react';
import type { PreparedData } from '../data/prepare-data';
import type { GetColorBySourceId } from '../data/use-indicateur-sources';
import type { SourceType } from '../types';
import { CellSourceName } from './cell-source-name';
import { IndicateurValueSlot } from './indicateur-value-slot';
import { prepareIndicateurTableData } from './prepare-indicateur-table-data';

type Props = {
  definition: Pick<IndicateurDefinition, 'titre' | 'unite' | 'periodicite'>;
  additionalPeriods?: IndicateurPeriod[];
  resultats: PreparedData;
  objectifs: PreparedData;
  readonly?: boolean;
  confidentiel?: boolean;
  addPeriod?: ReactNode;
  getColorBySourceId: GetColorBySourceId;
  onSave: (
    period: IndicateurPeriod,
    type: SourceType,
    value: number | null
  ) => Promise<boolean>;
  onDelete: (period: IndicateurPeriod) => void;
  onComment: (
    period: IndicateurPeriod,
    type: SourceType,
    comment: string
  ) => void;
};

/** Results and objectives share a cell, while source versions remain separate. */
export const IndicateurValeursTable = ({
  definition,
  resultats,
  objectifs,
  additionalPeriods = [],
  readonly,
  confidentiel,
  addPeriod,
  getColorBySourceId,
  onSave,
  onDelete,
  onComment,
}: Props) => {
  const { sources, periodes } = prepareIndicateurTableData(
    resultats,
    objectifs,
    additionalPeriods
  );
  const localValues = resultats.valeursExistantes;
  return (
    <div
      className="overflow-x-auto rounded-lg border border-grey-3"
      data-test="indicateurs.valeurs.table"
    >
      <Table
        className="table-auto border-collapse text-sm"
        aria-label={definition.titre}
      >
        <thead className="bg-primary-1">
          <tr>
            <TableHeaderCell
              scope="col"
              className="min-w-64 font-bold text-primary-9"
            >
              {definition.titre} {`(${definition.unite})`}
            </TableHeaderCell>
            {periodes.map((period) => {
              const key = IndicateurPeriods.key(period);
              const label = formatIndicateurPeriod(period);
              const localValue = localValues.find(
                (value) => IndicateurPeriods.key(value.periode) === key
              );
              const isPrivate =
                confidentiel &&
                resultats.dernierePeriodeModePrive &&
                IndicateurPeriods.key(resultats.dernierePeriodeModePrive) ===
                  key;
              return (
                <TableHeaderCell
                  key={key}
                  scope="col"
                  className="min-w-52 border-l border-grey-3 text-primary-9 font-bold"
                  align="center"
                >
                  {isPrivate && (
                    <Tooltip label={appLabels.resultatModePrive}>
                      <span tabIndex={0}>
                        <Icon icon="lock-fill" size="sm" />
                      </span>
                    </Tooltip>
                  )}
                  {label}
                  {(localValue ||
                    additionalPeriods.some(
                      (candidate) => IndicateurPeriods.key(candidate) === key
                    )) &&
                    !readonly &&
                    period.periodicite === definition.periodicite && (
                      <Button
                        icon="close-line"
                        size="xs"
                        variant="white"
                        className="!bg-transparent !border-transparent"
                        title={appLabels.indicateurSupprimerPeriode(label)}
                        onClick={() => onDelete(period)}
                        data-test="indicateurs.valeurs.periode.delete"
                      />
                    )}
                </TableHeaderCell>
              );
            })}
            {addPeriod && (
              <TableHeaderCell
                scope="col"
                className="min-w-56 border-l border-grey-3"
              >
                {addPeriod}
              </TableHeaderCell>
            )}
          </tr>
        </thead>
        <tbody>
          {sources.map((row) => (
            <tr key={row.key} className="border-t border-grey-3">
              <CellSourceName
                source={row.source}
                unite={definition.unite}
                type={row.resultats ? 'resultat' : 'objectif'}
                getColorBySourceId={getColorBySourceId}
              />
              {periodes.map((period) => {
                const key = IndicateurPeriods.key(period);
                const resultat = row.resultats?.valeurs.find(
                  (value) => IndicateurPeriods.key(value.periode) === key
                );
                const objectif = row.objectifs?.valeurs.find(
                  (value) => IndicateurPeriods.key(value.periode) === key
                );
                const isLocal = row.source.source === 'collectivite';
                return (
                  <TableCell
                    key={key}
                    className="border-l border-grey-3 !px-2"
                    data-period={IndicateurPeriods.serialize(period)}
                    data-source={row.source.source}
                  >
                    <IndicateurCombinedValue
                      period={period}
                      resultat={resultat?.valeur ?? null}
                      objectif={objectif?.valeur ?? null}
                      readonly={
                        readonly ||
                        !isLocal ||
                        period.periodicite !== definition.periodicite
                      }
                      onSave={(type, value) => onSave(period, type, value)}
                    />
                    {isLocal && (
                      <div className="flex justify-center gap-2">
                        {(['resultat', 'objectif'] as const).map((type) => {
                          const comment = (
                            type === 'resultat' ? resultat : objectif
                          )?.commentaire;
                          if (readonly && !comment) return null;
                          return (
                            <Button
                              key={type}
                              icon="question-answer-line"
                              variant="white"
                              size="xs"
                              className="!border-transparent"
                              notification={comment ? { number: 1 } : undefined}
                              title={appLabels.indicateurCommentaireValeur(
                                type,
                                formatIndicateurPeriod(period)
                              )}
                              onClick={() =>
                                onComment(period, type, comment ?? '')
                              }
                            />
                          );
                        })}
                      </div>
                    )}
                  </TableCell>
                );
              })}
              {addPeriod && <TableCell className="border-l border-grey-3" />}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export const IndicateurCombinedValue = ({
  period,
  resultat,
  objectif,
  readonly,
  onSave,
}: {
  period: IndicateurPeriod;
  resultat: number | null;
  objectif: number | null;
  readonly?: boolean;
  onSave: (type: SourceType, value: number | null) => Promise<boolean>;
}) => {
  const [initialField, setInitialField] = useState<SourceType | null>(null);
  const empty = resultat === null && objectif === null;
  if (empty && readonly)
    return <span className="sr-only">{appLabels.indicateurValeurAbsente}</span>;
  if (empty && !initialField)
    return (
      <div className="flex justify-center">
        <ButtonMenu
          size="xs"
          variant="white"
          icon="add-line"
          withArrow
          title={appLabels.indicateurChampValeur(
            appLabels.indicateurAjouterDonnee,
            formatIndicateurPeriod(period)
          )}
          data-test="indicateurs.valeurs.add"
          menu={{
            actions: [
              {
                label: capitalize(appLabels.indicateurResultat()),
                onClick: () => setInitialField('resultat'),
              },
              {
                label: capitalize(appLabels.indicateurObjectif()),
                onClick: () => setInitialField('objectif'),
              },
            ],
          }}
        >
          {appLabels.indicateurAjouterDonnee}
        </ButtonMenu>
      </div>
    );
  return (
    <div className="flex items-center justify-center divide-x divide-grey-3">
      {(['resultat', 'objectif'] as const).map((type) => (
        <div key={type} className="px-1">
          <IndicateurValueSlot
            type={type}
            periodeLabel={formatIndicateurPeriod(period)}
            value={type === 'resultat' ? resultat : objectif}
            readonly={readonly}
            initiallyEditing={initialField === type}
            onSave={(value) => onSave(type, value)}
            onClose={() => setInitialField(null)}
          />
        </div>
      ))}
    </div>
  );
};
