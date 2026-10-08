import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { IndicateurHeaderTitleCell } from '@/app/indicateurs/valeurs/grid/indicateur-title.header-cell';
import { IndicateurValeurPeriodeHeaderCell } from '@/app/indicateurs/valeurs/grid/indicateur-valeur-periode.header-cell';
import { IndicateurValeursCombinedCell } from '@/app/indicateurs/valeurs/grid/indicateur-valeurs-combined.cell';
import { IndicateurValeursTableFrame } from '@/app/indicateurs/valeurs/grid/indicateur-valeurs.table-frame';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { appLabels } from '@/app/labels/catalog';
import {
  Button,
  Icon,
  TableCell,
  TableHead,
  TableHeaderCell,
  Tooltip,
} from '@tet/ui';
import type { ReactNode } from 'react';
import type { IndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
import type { GetColorBySourceId } from '../data/use-indicateur-sources';
import type { SourceType } from '../types';
import { CellSourceName } from './cell-source-name';
import { prepareIndicateurTableData } from './prepare-indicateur-table-data';

type Props = {
  definition: Pick<IndicateurDefinition, 'titre' | 'unite'>;
  additionalPeriodes?: readonly IndicateurPeriode[];
  resultats: IndicateurPeriodeData;
  objectifs: IndicateurPeriodeData;
  readonly?: boolean;
  confidentiel?: boolean;
  addPeriode?: ReactNode;
  getColorBySourceId: GetColorBySourceId;
  onSave: (
    periode: IndicateurPeriode,
    type: SourceType,
    value: number | null
  ) => Promise<boolean>;
  onDelete: (periode: IndicateurPeriode) => void;
  onComment: (
    periode: IndicateurPeriode,
    type: SourceType,
    comment: string
  ) => void;
};

/** Results and objectives share a cell, while source versions remain separate. */
export const IndicateurValeursTable = ({
  definition,
  resultats,
  objectifs,
  additionalPeriodes = [],
  readonly,
  confidentiel,
  addPeriode,
  getColorBySourceId,
  onSave,
  onDelete,
  onComment,
}: Props) => {
  const { sources, periodes } = prepareIndicateurTableData(
    resultats,
    objectifs,
    additionalPeriodes
  );
  const additionalPeriodeKeys = new Set(
    additionalPeriodes.map(IndicateurPeriodes.key)
  );
  const localValues = resultats.valeursExistantes;
  return (
    <IndicateurValeursTableFrame
      maxHeight="none"
      layout="auto"
      role="table"
      aria-label={definition.titre}
      data-test="indicateurs.valeurs.table"
    >
      <TableHead className="z-40">
        <tr>
          <IndicateurHeaderTitleCell
            title={definition.titre}
            unit={definition.unite}
          />
          {periodes.map((periode) => {
            const key = IndicateurPeriodes.key(periode);
            const label = IndicateurPeriodes.format(periode);
            const localValue = localValues.find(
              (value) => IndicateurPeriodes.key(value.periode) === key
            );
            const isPrivate =
              confidentiel &&
              resultats.periodeModePrive &&
              IndicateurPeriodes.key(resultats.periodeModePrive) === key;
            return (
              <IndicateurValeurPeriodeHeaderCell
                key={key}
                label={<span>{label}</span>}
                className="w-52 min-w-52"
              >
                {isPrivate && (
                  <Tooltip label={appLabels.resultatModePrive}>
                    <span tabIndex={0}>
                      <Icon icon="lock-fill" size="sm" />
                    </span>
                  </Tooltip>
                )}
                {(localValue || additionalPeriodeKeys.has(key)) &&
                  !readonly && (
                    <Button
                      icon="close-line"
                      size="xs"
                      variant="white"
                      className="!bg-transparent !border-transparent"
                      title={appLabels.indicateurSupprimerPeriode(label)}
                      aria-label={appLabels.indicateurSupprimerPeriode(label)}
                      onClick={() => onDelete(periode)}
                      data-test="indicateurs.valeurs.periode.delete"
                    />
                  )}
              </IndicateurValeurPeriodeHeaderCell>
            );
          })}
          {addPeriode && (
            <TableHeaderCell scope="col" className="min-w-56 align-middle">
              {addPeriode}
            </TableHeaderCell>
          )}
        </tr>
      </TableHead>
      <tbody>
        {sources.map((row) => (
          <tr key={row.key} className="border-t border-grey-3">
            <CellSourceName
              source={row.source}
              unite={definition.unite}
              type={row.resultats ? 'resultat' : 'objectif'}
              getColorBySourceId={getColorBySourceId}
            />
            {periodes.map((periode) => {
              const key = IndicateurPeriodes.key(periode);
              const label = IndicateurPeriodes.format(periode);
              const resultat = row.resultats?.valeurs.find(
                (value) => IndicateurPeriodes.key(value.periode) === key
              );
              const objectif = row.objectifs?.valeurs.find(
                (value) => IndicateurPeriodes.key(value.periode) === key
              );
              const isLocal = row.source.source === 'collectivite';
              const renderCommentAction = (type: SourceType) => {
                const comment = (type === 'resultat' ? resultat : objectif)
                  ?.commentaire;
                if (!isLocal || (readonly && !comment)) return null;
                return (
                  <Button
                    icon="question-answer-line"
                    variant="white"
                    size="xs"
                    className="!border-transparent"
                    notification={comment ? { number: 1 } : undefined}
                    title={appLabels.indicateurCommentaireValeur(type, label)}
                    aria-label={appLabels.indicateurCommentaireValeur(
                      type,
                      label
                    )}
                    onClick={() => onComment(periode, type, comment ?? '')}
                  />
                );
              };
              return (
                <TableCell
                  key={key}
                  className="border-b border-r border-grey-3 !px-2"
                  data-period={periode.dateDebut}
                  data-periodicite={periode.periodicite}
                  data-source={row.source.source}
                >
                  <IndicateurValeursCombinedCell
                    periodeLabel={label}
                    resultat={resultat?.valeur ?? null}
                    objectif={objectif?.valeur ?? null}
                    actions={{
                      resultat: renderCommentAction('resultat'),
                      objectif: renderCommentAction('objectif'),
                    }}
                    readonly={readonly || !isLocal}
                    onSave={(type, value) => onSave(periode, type, value)}
                  />
                </TableCell>
              );
            })}
            {addPeriode && <TableCell className="border-b border-grey-3" />}
          </tr>
        ))}
      </tbody>
    </IndicateurValeursTableFrame>
  );
};
