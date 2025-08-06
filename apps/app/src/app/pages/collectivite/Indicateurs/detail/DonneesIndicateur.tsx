import { useCollectiviteId } from '@/api/collectivites';
import { QuestionReponseList } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentielQR';
import { useChangeReponseHandler } from '@/app/referentiels/personnalisations/PersoPotentielModal/useChangeReponseHandler';
import { Divider } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { useIndicateurChartInfo } from '../data/use-indicateur-chart';
import { useIndicateurPersonnalisation } from '../data/use-indicateur-personnalisation';
import IndicateurDetailChart from '../Indicateur/detail/IndicateurDetailChart';
import { IndicateurValuesTabs } from '../Indicateur/detail/IndicateurValuesTabs';
import { TIndicateurDefinition } from '../types';
import { CommentaireIndicateurInput } from './CommentaireIndicateurInput';
import { IndicateurSourcesSelect } from './indicateur-sources.select';
import ThematiquesIndicateurInput from './ThematiquesIndicateurInput';
import { TypeSegmentationSelect } from './type-segmentation.select';
import UniteIndicateurInput from './UniteIndicateurInput';

type Props = {
  definition: TIndicateurDefinition;
  isPerso?: boolean;
  isReadonly?: boolean;
  updateUnite: (value: string) => void;
  updateDescription: (value: string) => void;
};

const DonneesIndicateur = ({
  definition,
  isPerso = false,
  isReadonly = false,
  updateUnite,
  updateDescription,
}: Props) => {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const { commentaire, unite } = definition;

  // charge les valeurs à afficher dans le graphe
  const chartInfo = useIndicateurChartInfo({
    definition,
  });

  const { sourceFilter, typesSegmentation } = chartInfo;

  const questionReponses = useIndicateurPersonnalisation(
    definition.identifiantReferentiel,
    chartInfo.sourceFilter.valeursReference?.drom ?? false
  );
  const collectiviteId = useCollectiviteId();
  const handleChange = useChangeReponseHandler(collectiviteId, []);

  return (
    <div className="flex flex-col gap-7 bg-white p-10 border border-grey-3 rounded-xl">
      <div className="flex flex-row gap-4">
        {/* Unité personnalisée */}
        {isPerso && (
          <UniteIndicateurInput
            unite={unite}
            updateUnite={updateUnite}
            disabled={isReadonly}
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
      {questionReponses && (
        <QuestionReponseList
          questionReponses={questionReponses}
          variant="indicateur"
          onChange={handleChange}
        />
      )}

      {/* Graphe */}
      <IndicateurDetailChart
        className="mb-6"
        chartInfo={chartInfo}
        definition={definition}
        isReadonly={isReadonly}
        onAddValue={() => setIsTableModalOpen(true)}
      />

      <div
        className={classNames('flex flex-col gap-7', {
          'invisible h-0': !chartInfo.hasValeur,
        })}
      >
        <Divider />

        {/* Tableau */}
        <IndicateurValuesTabs
          definition={definition}
          chartInfo={chartInfo}
          openModalState={{
            isOpen: isTableModalOpen,
            setIsOpen: setIsTableModalOpen,
          }}
        />

        <Divider className="mt-6" />
      </div>

      {isPerso && (
        <ThematiquesIndicateurInput
          definition={definition}
          disabled={isReadonly}
        />
      )}

      <CommentaireIndicateurInput
        description={commentaire}
        updateDescription={updateDescription}
        disabled={isReadonly}
      />
    </div>
  );
};

export default DonneesIndicateur;
