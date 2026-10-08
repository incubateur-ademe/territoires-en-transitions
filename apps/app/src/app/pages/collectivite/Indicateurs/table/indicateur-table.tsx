import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import type { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import {
  prepareIndicateurPeriodeData,
  type IndicateurPeriodeValue,
} from '../data/prepare-indicateur-periode-data';
import { useDeleteIndicateurValeur } from '../data/use-delete-indicateur-valeur';
import type { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { useGetColorBySourceId } from '../data/use-indicateur-sources';
import type { SourceType } from '../types';
import { ConfirmDelete } from './confirm-delete';
import { EditCommentaireModal } from './edit-commentaire-modal';
import { useIndicateurTableDeclaration } from './use-indicateur-table-declaration';
import { shouldConfirmValueDeletion } from './indicateur-valeur-deletion.rules';
import { IndicateurValeursTable } from './indicateur-valeurs-table';
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
  const annualData = chartInfo.data.valeurs;
  const resultats = prepareIndicateurPeriodeData(annualData.resultats);
  const objectifs = prepareIndicateurPeriodeData(annualData.objectifs);
  const [toBeDeleted, setToBeDeleted] = useState<IndicateurPeriodeValue | null>(
    null
  );
  const [comment, setComment] = useState<{
    periode: IndicateurPeriode;
    type: SourceType;
    text: string;
  } | null>(null);
  const { mutateAsync: upsert } = useUpsertIndicateurValeur();
  const { mutateAsync: deleteValeur } = useDeleteIndicateurValeur();
  const getColorBySourceId = useGetColorBySourceId();
  const canWrite =
    !readonly &&
    !definition.sansValeurUtilisateur &&
    chartInfo.sourceFilter.avecDonneesCollectivite;
  const declaration = useIndicateurTableDeclaration({
    canWrite,
    collectiviteId,
    definition,
    data: annualData.resultats,
    existingPeriodes: [...resultats.periodes, ...objectifs.periodes],
    openModalState,
  });
  const getExisting = (periode: IndicateurPeriode) =>
    resultats.valeursExistantes.find(
      (value) =>
        IndicateurPeriodes.key(value.periode) ===
        IndicateurPeriodes.key(periode)
    );
  const getWriteIdentity = (periode: IndicateurPeriode) => ({
    id: getExisting(periode)?.id,
    collectiviteId,
    indicateurId: definition.id,
    dateValeur: periode.dateDebut,
    periodicite: periode.periodicite,
  });
  const onDelete = async (periode: IndicateurPeriode) => {
    if (!canWrite) return;
    const existing = getExisting(periode);
    if (!existing) {
      declaration.removePeriode?.(periode);
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
      declaration.removePeriode?.(periode);
    } catch {
      /* The global mutation subscriber reports the failure. */
    }
  };
  return (
    <div className="flex flex-col gap-4">
      {declaration.controls && (
        <div className="flex justify-end">{declaration.controls}</div>
      )}
      <IndicateurValeursTable
        definition={definition}
        resultats={resultats}
        objectifs={objectifs}
        additionalPeriodes={declaration.additionalPeriodes}
        addPeriode={declaration.header}
        readonly={!canWrite}
        confidentiel={confidentiel}
        getColorBySourceId={getColorBySourceId}
        onSave={async (periode, type, value) => {
          if (!canWrite) return false;
          try {
            await upsert({ ...getWriteIdentity(periode), [type]: value });
            return true;
          } catch {
            return false;
          }
        }}
        onDelete={(periode) => void onDelete(periode)}
        onComment={(periode, type, text) => setComment({ periode, type, text })}
      />
      {!!resultats.donneesCollectivite?.valeurs.some(
        (value) => value.valeur != null
      ) && <PrivateModeSwitch definition={definition} isReadOnly={!canWrite} />}
      {declaration.modal}
      {comment && (
        <EditCommentaireModal
          definition={definition}
          periodeLabel={IndicateurPeriodes.format(comment.periode)}
          type={comment.type}
          commentaire={comment.text}
          openState={{ isOpen: true, setIsOpen: () => setComment(null) }}
          isReadonly={!canWrite}
          onChange={async (text) => {
            if (!canWrite) return false;
            try {
              await upsert({
                ...getWriteIdentity(comment.periode),
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
                .then(() => declaration.removePeriode?.(toBeDeleted.periode))
                .catch(() => undefined);
            }
            setToBeDeleted(null);
          }}
        />
      )}
    </div>
  );
};
