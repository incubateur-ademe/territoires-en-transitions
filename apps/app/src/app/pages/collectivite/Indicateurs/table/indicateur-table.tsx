import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import {
  formatIndicateurPeriod,
  IndicateurPeriods,
  type IndicateurPeriod,
} from '@tet/domain/indicateurs';
import type { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import type { PreparedValue } from '../data/prepare-data';
import { useDeleteIndicateurValeur } from '../data/use-delete-indicateur-valeur';
import type { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { useGetColorBySourceId } from '../data/use-indicateur-sources';
import type { SourceType } from '../types';
import { AddIndicateurPeriodeHeader } from './add-indicateur-periode.header';
import { AddIndicateurPeriodesModal } from './add-indicateur-periodes.modal';
import { ConfirmDelete } from './confirm-delete';
import { EditCommentaireModal } from './edit-commentaire-modal';
import { shouldConfirmValueDeletion } from './indicateur-valeur-deletion.rules';
import { IndicateurValeursTable } from './indicateur-valeurs-table';
import { prepareIndicateurTableData } from './prepare-indicateur-table-data';
import { PrivateModeSwitch } from './private-mode-switch';

type IndicateurTableProps = {
  chartInfo: IndicateurChartInfo;
  collectiviteId: number;
  definition: IndicateurDefinition;
  readonly?: boolean;
  confidentiel?: boolean;
  openModalState?: OpenState;
};

export const IndicateurTable = ({
  chartInfo,
  collectiviteId,
  definition,
  readonly,
  confidentiel,
  openModalState,
}: IndicateurTableProps) => {
  const { resultats, objectifs } = chartInfo.data.valeurs;
  const [additionalPeriods, setAdditionalPeriods] = useState<
    IndicateurPeriod[]
  >([]);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [toBeDeleted, setToBeDeleted] = useState<PreparedValue | null>(null);
  const [comment, setComment] = useState<{
    period: IndicateurPeriod;
    type: SourceType;
    text: string;
  } | null>(null);
  const isOpen = openModalState?.isOpen ?? internalIsOpen;
  const setIsOpen = openModalState?.setIsOpen ?? setInternalIsOpen;
  const { mutateAsync: upsert } = useUpsertIndicateurValeur();
  const { mutateAsync: deleteValeur } = useDeleteIndicateurValeur();
  const getColorBySourceId = useGetColorBySourceId();
  const canWrite =
    !readonly &&
    !definition.sansValeurUtilisateur &&
    chartInfo.sourceFilter.avecDonneesCollectivite;
  const { periodes } = prepareIndicateurTableData(
    resultats,
    objectifs,
    additionalPeriods
  );
  const getExisting = (period: IndicateurPeriod) =>
    resultats.valeursExistantes.find(
      (value) =>
        IndicateurPeriods.key(value.periode) === IndicateurPeriods.key(period)
    );
  const getWriteIdentity = (period: IndicateurPeriod) => ({
    id: getExisting(period)?.id,
    collectiviteId,
    indicateurId: definition.id,
    periodicite: period.periodicite,
    dateValeur: IndicateurPeriods.toDateValeur(period),
  });
  const onAdd = async (periods: IndicateurPeriod[]): Promise<boolean> => {
    if (!canWrite) return false;
    // Empty columns are editing drafts. Only entering a value/comment creates
    // an observation: a missing observation must not become a present null.
    setAdditionalPeriods((current) => [
      ...new Map(
        [...current, ...periods].map((period) => [
          IndicateurPeriods.key(period),
          period,
        ])
      ).values(),
    ]);
    return true;
  };
  const removeColumn = (period: IndicateurPeriod) =>
    setAdditionalPeriods((current) =>
      current.filter(
        (candidate) =>
          IndicateurPeriods.key(candidate) !== IndicateurPeriods.key(period)
      )
    );
  const onDelete = async (period: IndicateurPeriod) => {
    if (!canWrite) return;
    const existing = getExisting(period);
    if (!existing) {
      removeColumn(period);
      return;
    }
    if (shouldConfirmValueDeletion(existing)) {
      setToBeDeleted(existing);
      return;
    }
    try {
      await deleteValeur({
        id: existing.id,
        collectiviteId,
        indicateurId: definition.id,
      });
      removeColumn(period);
    } catch {
      /* The global mutation subscriber reports the failure. */
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <IndicateurValeursTable
        definition={definition}
        resultats={resultats}
        objectifs={objectifs}
        additionalPeriods={additionalPeriods}
        readonly={!canWrite}
        confidentiel={confidentiel}
        getColorBySourceId={getColorBySourceId}
        addPeriod={
          canWrite ? (
            <AddIndicateurPeriodeHeader
              periodicite={definition.periodicite}
              existingPeriods={periodes}
              onAdd={onAdd}
              onOpenModal={() => setIsOpen(true)}
            />
          ) : undefined
        }
        onSave={async (period, type, value) => {
          if (!canWrite || period.periodicite !== definition.periodicite)
            return false;
          try {
            await upsert({ ...getWriteIdentity(period), [type]: value });
            return true;
          } catch {
            return false;
          }
        }}
        onDelete={(period) => void onDelete(period)}
        onComment={(period, type, text) => setComment({ period, type, text })}
      />
      {!!resultats.donneesCollectivite?.valeurs.some(
        (value) => value.valeur != null
      ) && <PrivateModeSwitch definition={definition} isReadOnly={!canWrite} />}
      {isOpen && canWrite && (
        <AddIndicateurPeriodesModal
          periodicite={definition.periodicite}
          existingPeriods={periodes}
          openState={{ isOpen, setIsOpen }}
          onAdd={onAdd}
        />
      )}
      {comment && (
        <EditCommentaireModal
          definition={definition}
          periodeLabel={formatIndicateurPeriod(comment.period)}
          type={comment.type}
          commentaire={comment.text}
          openState={{ isOpen: true, setIsOpen: () => setComment(null) }}
          isReadonly={
            !canWrite || comment.period.periodicite !== definition.periodicite
          }
          onChange={async (text) => {
            if (
              !canWrite ||
              comment.period.periodicite !== definition.periodicite
            )
              return false;
            try {
              await upsert({
                ...getWriteIdentity(comment.period),
                [`${comment.type}Commentaire`]: text,
              });
              return true;
            } catch {
              return false;
            }
          }}
        />
      )}
      {toBeDeleted && (
        <ConfirmDelete
          valeur={toBeDeleted}
          unite={definition.unite}
          onDismissConfirm={(confirmed) => {
            if (confirmed) {
              void deleteValeur({
                id: toBeDeleted.id,
                collectiviteId,
                indicateurId: definition.id,
              })
                .then(() => removeColumn(toBeDeleted.periode))
                .catch(() => undefined);
            }
            setToBeDeleted(null);
          }}
        />
      )}
    </div>
  );
};
