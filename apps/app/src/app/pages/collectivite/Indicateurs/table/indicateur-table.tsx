import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import type { OpenState } from '@tet/ui/utils/types';
import { useState, type ReactNode } from 'react';
import {
  prepareIndicateurPeriodeData,
  type IndicateurPeriodeValue,
} from '../data/prepare-indicateur-periode-data';
import { ConfirmDelete } from './confirm-delete';
import { IndicateurActionsRow } from './indicateur-actions.row';
import { EditCommentaireModal } from './edit-commentaire-modal';
import { useIndicateurPeriodeCommentaires } from './use-indicateur-periode-commentaires';
import { useIndicateurPeriodeDeclaration } from './use-indicateur-periode-declaration';
import { shouldConfirmValueDeletion } from './indicateur-valeur-deletion.rules';
import { IndicateurValeursTable } from './indicateur-valeurs-table';
import { PrivateModeSwitch } from './private-mode-switch';
import { useIndicateurChart } from '../detail/context/indicateur-chart.context';
import { useIndicateurData } from '../detail/context/indicateur-data.context';
import { useIndicateurActions } from '../detail/context/indicateur-actions.context';

type IndicateurTableProps = {
  readonly?: boolean;
  openModalState?: OpenState;
  actions?: ReactNode;
};

export const IndicateurTable = ({
  readonly,
  openModalState,
  actions,
}: IndicateurTableProps) => {
  const { indicateur } = useIndicateurData();
  const { chartInfo } = useIndicateurChart();
  const resultats = prepareIndicateurPeriodeData(
    chartInfo.data.valeurs.resultats
  );
  const objectifs = prepareIndicateurPeriodeData(
    chartInfo.data.valeurs.objectifs
  );
  const [toBeDeleted, setToBeDeleted] = useState<IndicateurPeriodeValue | null>(
    null
  );
  const [commentedPeriode, setCommentedPeriode] =
    useState<IndicateurPeriode | null>(null);
  const commentaires = useIndicateurPeriodeCommentaires();
  const { saveValeur, declarePeriode, declarePeriodes, deleteValeur } =
    useIndicateurActions();
  const canWrite =
    !readonly &&
    !indicateur.sansValeurUtilisateur &&
    chartInfo.sourceFilter.avecDonneesCollectivite;
  const hasPrivateMode =
    canWrite &&
    !!resultats.donneesCollectivite?.valeurs.some(
      (value) => value.valeur != null
    );
  const existingPeriodes = IndicateurPeriodes.merge(
    resultats.periodes,
    objectifs.periodes
  );
  const declaration = useIndicateurPeriodeDeclaration({
    canWrite,
    periodicite: indicateur.periodicite,
    existingPeriodes,
    declarePeriode,
    declarePeriodes,
    openModalState,
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
        addPeriode={declaration.addPeriode}
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
        onComment={setCommentedPeriode}
      />
      {(actions !== undefined || hasPrivateMode) && (
        <IndicateurActionsRow leading={actions}>
          {hasPrivateMode && <PrivateModeSwitch />}
        </IndicateurActionsRow>
      )}
      {commentedPeriode && (
        <EditCommentaireModal
          periodeLabel={IndicateurPeriodes.format(commentedPeriode)}
          commentaires={commentaires.commentairesOf(commentedPeriode)}
          openState={{
            isOpen: true,
            setIsOpen: () => setCommentedPeriode(null),
          }}
          isReadonly={
            !canWrite || commentedPeriode.periodicite !== indicateur.periodicite
          }
          onChange={(periodeCommentaires) =>
            canWrite
              ? commentaires.save({
                  periode: commentedPeriode,
                  commentaires: periodeCommentaires,
                })
              : Promise.resolve(false)
          }
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
      {declaration.modal}
    </div>
  );
};
