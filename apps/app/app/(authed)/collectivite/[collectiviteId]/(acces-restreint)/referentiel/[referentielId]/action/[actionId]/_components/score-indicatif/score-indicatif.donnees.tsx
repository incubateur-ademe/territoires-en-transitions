import IndicateurDetailChart from '@/app/app/pages/collectivite/Indicateurs/Indicateur/detail/IndicateurDetailChart';
import { useIndicateurChartInfo } from '@/app/app/pages/collectivite/Indicateurs/data/use-indicateur-chart';
import { EditValeursModal } from '@/app/app/pages/collectivite/Indicateurs/table/edit-valeurs-modal';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { ScoreIndicatifAction } from './score-indicatif.types';
import {
  ScoreIndicatifValeursUtilisees,
  useSelectionValeurs,
} from './score-indicatif.valeurs-utilisees';
import { useSetValeursUtilisees } from './use-set-valeurs-utilisees';

export type ScoreIndicatifDonneesProps = {
  definition: IndicateurDefinition;
  scoreIndicatif: ScoreIndicatifAction;
  indicateurId: number;
  openState: OpenState;
};

/**
 * Affiche l'onglet "Données"
 */
export const ScoreIndicatifDonnees = (props: ScoreIndicatifDonneesProps) => {
  const { indicateurId, definition, scoreIndicatif, openState } = props;
  const chartInfo = useIndicateurChartInfo({ definition });
  const selectionValeurs = useSelectionValeurs({
    actionId: scoreIndicatif.actionId,
    indicateurId,
  });
  const { mutate: setScoreIndicatifValeurs } = useSetValeursUtilisees();
  const collectiviteId = useCollectiviteId();
  const [isAddValueOpen, setIsAddValueOpen] = useState(false);
  const { resultats, objectifs } = chartInfo.data.valeurs;
  const data = resultats || objectifs;

  return (
    <div className="flex flex-col gap-5">
      <IndicateurDetailChart
        definition={definition}
        chartInfo={chartInfo}
        isDownloadable={false}
      />
      <ScoreIndicatifValeursUtilisees
        selectionValeurs={selectionValeurs.fait}
        openAddDataDlg={() => setIsAddValueOpen(true)}
      />
      <ScoreIndicatifValeursUtilisees
        selectionValeurs={selectionValeurs.programme}
        openAddDataDlg={() => setIsAddValueOpen(true)}
      />
      <ModalFooterOKCancel
        btnOKProps={{
          onClick: () => {
            setScoreIndicatifValeurs({
              actionId: scoreIndicatif.actionId,
              collectiviteId,
              indicateurId,
              valeurs: [
                {
                  indicateurValeurId:
                    selectionValeurs.fait?.valeurCourante?.id ?? null,
                  typeScore: 'fait',
                },
                {
                  indicateurValeurId:
                    selectionValeurs.programme?.valeurCourante?.id ?? null,
                  typeScore: 'programme',
                },
              ],
            });
            openState.setIsOpen(false);
          },
        }}
        btnCancelProps={{ onClick: () => openState.setIsOpen(false) }}
      />
      {/** dialogue d'édition des valeurs */}
      {isAddValueOpen && (
        <EditValeursModal
          collectiviteId={collectiviteId}
          definition={definition}
          title="Ajouter une année"
          openState={{ isOpen: isAddValueOpen, setIsOpen: setIsAddValueOpen }}
          data={data}
        />
      )}
    </div>
  );
};
