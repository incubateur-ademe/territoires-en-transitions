import { Divider } from '@tet/ui';
import { useState } from 'react';
import IndicateurDetailChart from '../../../Indicateur/detail/IndicateurDetailChart';
import { IndicateurValuesTabs } from '../../../Indicateur/detail/IndicateurValuesTabs';
import { IndicateurCommentaireInput } from '../../content/donnees/indicateur-commentaire.input';
import { IndicateurDonneesCard } from '../../content/donnees/indicateur-donnees.card';
import { useIndicateurActions } from '../../context/indicateur-actions.context';
import { useIndicateurChart } from '../../context/indicateur-chart.context';
import { useIndicateurData } from '../../context/indicateur-data.context';
import {
  INDICATEUR_PERSONNALISATION_IDENTIFIANT,
  IndicateurPersonnalisationQuestions,
} from './indicateur-personnalisation.questions';
import { IndicateurSourcesSelect } from './indicateur-sources.select';
import { TypeSegmentationSelect } from './type-segmentation.select';

export const IndicateurPredefiniDonnees = () => {
  const { indicateur, canMutateIndicateur, canMutateValeur } =
    useIndicateurData();
  const { chartInfo } = useIndicateurChart();
  const { updateCommentaire } = useIndicateurActions();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const { commentaire } = indicateur;

  const { sourceFilter, typesSegmentation } = chartInfo;

  const isValeursReadonly =
    !canMutateValeur || indicateur.sansValeurUtilisateur;
  const hasPersonnalisationQuestions =
    indicateur.identifiantReferentiel ===
    INDICATEUR_PERSONNALISATION_IDENTIFIANT;

  return (
    <IndicateurDonneesCard>
      <div className="flex flex-row gap-4">
        {sourceFilter.availableOptions.length > 1 && (
          <IndicateurSourcesSelect sourceFilter={sourceFilter} />
        )}

        {typesSegmentation?.length > 1 && (
          <TypeSegmentationSelect chartInfo={chartInfo} />
        )}
      </div>

      {hasPersonnalisationQuestions && (
        <IndicateurPersonnalisationQuestions
          isDrom={chartInfo.sourceFilter.valeursReference?.drom ?? false}
          canEdit={canMutateIndicateur}
        />
      )}

      <IndicateurDetailChart
        className="mb-6"
        chartInfo={chartInfo}
        indicateur={indicateur}
        isReadonly={isValeursReadonly}
        onAddValue={() => setIsTableModalOpen(true)}
      />

      <div className="flex flex-col gap-7">
        <Divider color="primary" className="mb-6" />

        <IndicateurValuesTabs
          isReadonly={isValeursReadonly}
          openModalState={{
            isOpen: isTableModalOpen,
            setIsOpen: setIsTableModalOpen,
          }}
        />

        <Divider color="primary" className="my-6" />
      </div>

      <IndicateurCommentaireInput
        key={commentaire}
        commentaire={commentaire}
        disabled={!canMutateIndicateur}
        updateCommentaire={updateCommentaire}
      />
    </IndicateurDonneesCard>
  );
};
