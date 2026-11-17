import { isIndicateurPerso } from '@tet/domain/indicateurs';
import { Divider } from '@tet/ui';
import { useState } from 'react';
import { useIndicateurChart } from './indicateur-chart.context';
import { useIndicateurDefinition } from './indicateur-definition.context';
import {
  INDICATEUR_PERSONNALISATION_IDENTIFIANT,
  IndicateurPersonnalisationQuestions,
} from './indicateur-personnalisation.questions';
import IndicateurDetailChart from '../Indicateur/detail/IndicateurDetailChart';
import { IndicateurValuesTabs } from '../Indicateur/detail/IndicateurValuesTabs';
import { IndicateurCommentaireInput } from './indicateur-commentaire.input';
import { IndicateurSourcesSelect } from './indicateur-sources.select';
import { IndicateurUniteInput } from './indicateur-unite.input';
import { ThematiquesIndicateurInput } from './ThematiquesIndicateurInput';
import { TypeSegmentationSelect } from './type-segmentation.select';

type Props = {
  updateUnite: (value: string) => void;
  updateCommentaire: (value: string) => void;
};

const DonneesIndicateur = ({ updateUnite, updateCommentaire }: Props) => {
  const { indicateur, canMutateIndicateur, canMutateValeur } =
    useIndicateurDefinition();
  const { chartInfo } = useIndicateurChart();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const { commentaire, unite } = indicateur;

  const { sourceFilter, typesSegmentation } = chartInfo;

  const isPerso = isIndicateurPerso(indicateur);
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
      <IndicateurDetailChart
        className="mb-6"
        chartInfo={chartInfo}
        indicateur={indicateur}
        isReadonly={!canMutateValeur || indicateur.sansValeurUtilisateur}
        onAddValue={() => setIsTableModalOpen(true)}
      />

      <div className="flex flex-col gap-7">
        <Divider color="primary" className="mb-6" />

        {/* Tableau */}
        <IndicateurValuesTabs
          isReadonly={!canMutateValeur || indicateur.sansValeurUtilisateur}
          openModalState={{
            isOpen: isTableModalOpen,
            setIsOpen: setIsTableModalOpen,
          }}
        />

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

export default DonneesIndicateur;
