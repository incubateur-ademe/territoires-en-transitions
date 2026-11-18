import { isIndicateurPerso } from '@tet/domain/indicateurs';
import { Divider } from '@tet/ui';
import { useState } from 'react';
import { useIndicateurActions } from '../../context/indicateur-actions.context';
import { useIndicateurChart } from '../../context/indicateur-chart.context';
import { useIndicateurData } from '../../context/indicateur-data.context';
import {
  INDICATEUR_PERSONNALISATION_IDENTIFIANT,
  IndicateurPersonnalisationQuestions,
} from './indicateur-personnalisation.questions';
import IndicateurDetailChart from '../../../Indicateur/detail/IndicateurDetailChart';
import { IndicateurValuesTabs } from '../../../Indicateur/detail/IndicateurValuesTabs';
import { IndicateurSousIndicateursTable } from '../sous-indicateurs/indicateur-sous-indicateurs-table.view';
import { IndicateurCommentaireInput } from './indicateur-commentaire.input';
import { IndicateurSousIndicateursChart } from './indicateur-sous-indicateurs-chart.view';
import { IndicateurSourcesSelect } from './indicateur-sources.select';
import { IndicateurUniteInput } from './indicateur-unite.input';
import { ThematiquesIndicateurInput } from './thematiques-indicateur.input';
import { TypeSegmentationSelect } from './type-segmentation.select';

export const IndicateurDonnees = () => {
  const { indicateur, canMutateIndicateur, canMutateValeur } =
    useIndicateurData();
  const { chartInfo } = useIndicateurChart();
  const { updateUnite, updateCommentaire } = useIndicateurActions();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const { commentaire, unite } = indicateur;

  const { sourceFilter, typesSegmentation } = chartInfo;

  const isPerso = isIndicateurPerso(indicateur);
  const hasSousIndicateurs = isPerso && indicateur.enfants.length > 0;
  const hasPersonnalisationQuestions =
    indicateur.identifiantReferentiel ===
    INDICATEUR_PERSONNALISATION_IDENTIFIANT;

  return (
    <div className="flex flex-col gap-7 bg-white p-10 border border-grey-3 rounded-xl">
      <div className="flex flex-row gap-4">
        {/* Unité personnalisée */}
        {isPerso && (
          <IndicateurUniteInput
            unite={unite}
            updateUnite={updateUnite}
            disabled={!canMutateIndicateur}
          />
        )}

        {/** Sélecteur de sources de données */}
        {!isPerso && sourceFilter.availableOptions.length > 1 && (
          <IndicateurSourcesSelect sourceFilter={sourceFilter} />
        )}

        {/* sélecteur de segmentation */}
        {typesSegmentation?.length > 1 && (
          <TypeSegmentationSelect chartInfo={chartInfo} />
        )}
      </div>

      {/** Q/R personnalisation */}
      {hasPersonnalisationQuestions && (
        <IndicateurPersonnalisationQuestions
          isDrom={chartInfo.sourceFilter.valeursReference?.drom ?? false}
          canEdit={canMutateIndicateur}
        />
      )}

      {/* Graphe */}
      {hasSousIndicateurs ? (
        <div className="mb-6">
          <IndicateurSousIndicateursChart
            indicateurId={indicateur.id}
            unite={unite}
            periodicite={indicateur.periodicite}
          />
        </div>
      ) : (
        <IndicateurDetailChart
          className="mb-6"
          chartInfo={chartInfo}
          indicateur={indicateur}
          isReadonly={!canMutateValeur || indicateur.sansValeurUtilisateur}
          onAddValue={() => setIsTableModalOpen(true)}
        />
      )}

      <div className="flex flex-col gap-7">
        <Divider color="primary" className="mb-6" />

        {/* Tableau */}
        {hasSousIndicateurs ? (
          <IndicateurSousIndicateursTable
            indicateurId={indicateur.id}
            titre={indicateur.titre}
            unite={unite}
            periodicite={indicateur.periodicite}
          />
        ) : (
          <IndicateurValuesTabs
            isReadonly={!canMutateValeur || indicateur.sansValeurUtilisateur}
            openModalState={{
              isOpen: isTableModalOpen,
              setIsOpen: setIsTableModalOpen,
            }}
          />
        )}

        <Divider color="primary" className="my-6" />
      </div>

      {isPerso && (
        <ThematiquesIndicateurInput disabled={!canMutateIndicateur} />
      )}

      <IndicateurCommentaireInput
        key={commentaire}
        commentaire={commentaire}
        disabled={!canMutateIndicateur}
        updateCommentaire={updateCommentaire}
      />
    </div>
  );
};
