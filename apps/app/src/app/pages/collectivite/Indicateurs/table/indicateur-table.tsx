import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { Button } from '@tet/ui';
import type { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import {
  prepareIndicateurPeriodeData,
  type IndicateurPeriodeValue,
} from '../data/prepare-indicateur-periode-data';
import { ConfirmDelete } from './confirm-delete';
import { EditCommentaireModal } from './edit-commentaire-modal';
import { AddIndicateurPeriodesModal } from './add-indicateur-periodes.modal';
import { useIndicateurTableDeclaration } from './use-indicateur-table-declaration';
import { shouldConfirmValueDeletion } from './indicateur-valeur-deletion.rules';
import { IndicateurValeursTable } from './indicateur-valeurs-table';
import { PrivateModeSwitch } from './private-mode-switch';
import { useIndicateurChart } from '../detail/indicateur-chart.context';
import { useIndicateurData } from '../detail/indicateur-data.context';
import { useIndicateurActions } from '../detail/indicateur-actions.context';

type IndicateurTableProps = {
  readonly?: boolean;
  openModalState?: OpenState;
};

export const IndicateurTable = ({
  readonly,
  openModalState,
}: IndicateurTableProps) => {
  const { indicateur } = useIndicateurData();
  const { chartInfo } = useIndicateurChart();
  const resultats = prepareIndicateurPeriodeData(
    chartInfo.data.valeurs.resultats
  );
  const objectifs = prepareIndicateurPeriodeData(
    chartInfo.data.valeurs.objectifs
  );
  const isAnnual =
    indicateur.periodicite === IndicateurPeriodiciteEnum.ANNUELLE;
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = openModalState?.isOpen ?? internalIsOpen;
  const setIsOpen = openModalState?.setIsOpen ?? setInternalIsOpen;
  const [toBeDeleted, setToBeDeleted] = useState<IndicateurPeriodeValue | null>(
    null
  );
  const [comment, setComment] = useState<{
    periode: IndicateurPeriode;
    commentaires: { resultat: string; objectif: string };
  } | null>(null);
  const { saveValeur, declarePeriodes, deleteValeur } = useIndicateurActions();
  const canWrite =
    !readonly &&
    !indicateur.sansValeurUtilisateur &&
    chartInfo.sourceFilter.avecDonneesCollectivite;
  const existingPeriodes = IndicateurPeriodes.merge(
    resultats.periodes,
    objectifs.periodes
  );
  const declaration = useIndicateurTableDeclaration({
    canWrite: canWrite && isAnnual,
    periodicite: indicateur.periodicite,
    existingPeriodes,
    openModalState: isAnnual ? openModalState : undefined,
  });
  const getExisting = (periode: IndicateurPeriode) =>
    resultats.valeursExistantes.find(
      (value) =>
        IndicateurPeriodes.key(value.periode) ===
        IndicateurPeriodes.key(periode)
    );
  const getWriteIdentity = (periode: IndicateurPeriode) => {
    if (periode.periodicite !== indicateur.periodicite) {
      throw new Error('La périodicité doit correspondre à celle du tableau');
    }
    return {
      id: getExisting(periode)?.id,
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
      await deleteValeur(existing.id);
    } catch {
      /* The global mutation subscriber reports the failure. */
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <IndicateurValeursTable
        indicateur={indicateur}
        resultats={resultats}
        objectifs={objectifs}
        addPeriode={
          isAnnual ? (
            declaration.header
          ) : canWrite ? (
            <Button size="sm" onClick={() => setIsOpen(true)}>
              {
                getIndicateurPeriodPresentation(indicateur.periodicite).editor
                  .addLabel
              }
            </Button>
          ) : undefined
        }
        periodeToReveal={declaration.periodeToReveal}
        readonly={!canWrite}
        confidentiel={indicateur.estConfidentiel ?? false}
        onSave={async (periode, type, value) => {
          if (!canWrite) return false;
          try {
            await saveValeur({ ...getWriteIdentity(periode), [type]: value });
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
      ) && <PrivateModeSwitch isReadOnly={!canWrite} />}
      {comment && (
        <EditCommentaireModal
          periodeLabel={IndicateurPeriodes.format(comment.periode)}
          commentaires={comment.commentaires}
          openState={{ isOpen: true, setIsOpen: () => setComment(null) }}
          isReadonly={
            !canWrite || comment.periode.periodicite !== indicateur.periodicite
          }
          onChange={async (commentaires) => {
            if (!canWrite) return false;
            try {
              await saveValeur({
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
          unite={indicateur.unite}
          onDismissConfirm={(confirmed) => {
            if (confirmed) {
              void deleteValeur(toBeDeleted.id).catch(() => undefined);
            }
            setToBeDeleted(null);
          }}
        />
      )}
      {indicateur.periodicite !== IndicateurPeriodiciteEnum.ANNUELLE &&
        canWrite &&
        isOpen && (
          <AddIndicateurPeriodesModal
            periodicite={indicateur.periodicite}
            openState={{ isOpen, setIsOpen }}
            existingPeriodes={existingPeriodes}
            onAdd={declarePeriodes}
          />
        )}
    </div>
  );
};
