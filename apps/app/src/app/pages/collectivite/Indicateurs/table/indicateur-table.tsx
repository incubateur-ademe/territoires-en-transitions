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
    commentaires: { resultat: string; objectif: string };
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
    periodicite: chartInfo.periodicite,
    collectiviteId,
    definition,
    existingPeriodes: IndicateurPeriodes.merge(
      resultats.periodes,
      objectifs.periodes
    ),
    openModalState,
  });
  const getExisting = (periode: IndicateurPeriode) =>
    resultats.valeursExistantes.find(
      (value) =>
        IndicateurPeriodes.key(value.periode) ===
        IndicateurPeriodes.key(periode)
    );
  const getWriteIdentity = (periode: IndicateurPeriode) => {
    if (periode.periodicite !== chartInfo.periodicite) {
      throw new Error('La périodicité doit correspondre à celle du tableau');
    }
    return {
      id: getExisting(periode)?.id,
      collectiviteId,
      indicateurId: definition.id,
      dateValeur: periode.dateDebut,
      periodicite: periode.periodicite,
    };
  };
  const onDelete = async (periode: IndicateurPeriode) => {
    if (!canWrite) return;
    const existing = getExisting(periode);
    if (!existing) return;
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
        onComment={(periode) => {
          const existing = getExisting(periode);
          setComment({
            periode,
            commentaires: {
              resultat: existing?.resultatCommentaire ?? '',
              objectif: existing?.objectifCommentaire ?? '',
            },
          });
        }}
      />
      {!!resultats.donneesCollectivite?.valeurs.some(
        (value) => value.valeur != null
      ) && <PrivateModeSwitch definition={definition} isReadOnly={!canWrite} />}
      {comment && (
        <EditCommentaireModal
          periodeLabel={IndicateurPeriodes.format(comment.periode)}
          commentaires={comment.commentaires}
          openState={{ isOpen: true, setIsOpen: () => setComment(null) }}
          isReadonly={!canWrite}
          onChange={async (commentaires) => {
            if (!canWrite) return false;
            try {
              await upsert({
                ...getWriteIdentity(comment.periode),
                resultatCommentaire: commentaires.resultat,
                objectifCommentaire: commentaires.objectif,
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
              }).catch(() => undefined);
            }
            setToBeDeleted(null);
          }}
        />
      )}
    </div>
  );
};
