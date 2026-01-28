import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { QuestionReponseList } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentielQR';
import { useChangeReponseHandler } from '@/app/referentiels/personnalisations/PersoPotentielModal/useChangeReponseHandler';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Divider } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { useIndicateurChartInfo } from '../data/use-indicateur-chart';
import { useIndicateurPersonnalisation } from '../data/use-indicateur-personnalisation';
import IndicateurDetailChart from '../Indicateur/detail/IndicateurDetailChart';
import { IndicateurValuesTabs } from '../Indicateur/detail/IndicateurValuesTabs';
import { IndicateurCommentaireInput } from './indicateur-commentaire.input';
import { IndicateurSourcesSelect } from './indicateur-sources.select';
import { IndicateurUniteInput } from './indicateur-unite.input';
import { ThematiquesIndicateurInput } from './ThematiquesIndicateurInput';
import { TypeSegmentationSelect } from './type-segmentation.select';

type Props = {
  definition: IndicateurDefinition;
  isReadonly?: boolean;
  updateUnite: (value: string) => void;
  updateCommentaire: (value: string) => void;
};

const DonneesIndicateur = ({
  definition,
  isReadonly = false,
  updateUnite,
  updateCommentaire,
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
  const { collectiviteId } = useCurrentCollectivite();
  const handleChange = useChangeReponseHandler(collectiviteId, []);

  return (
    <div className="flex flex-col gap-7 bg-white p-10 border border-grey-3 rounded-xl">
      <div className="flex flex-row gap-4">
        {/* Unité personnalisée */}
        {definition.estPerso && (
          <IndicateurUniteInput
            unite={unite}
            updateUnite={updateUnite}
            disabled={isReadonly}
          />
        )}

        {/** Sélecteur de sources de données */}
        {!definition.estPerso && sourceFilter.availableOptions.length > 1 && (
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
          canEdit={!isReadonly}
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
        <Divider color="primary" className="mb-6" />

        {/* Tableau */}
        <IndicateurValuesTabs
          definition={definition}
          chartInfo={chartInfo}
          isReadonly={isReadonly}
          openModalState={{
            isOpen: isTableModalOpen,
            setIsOpen: setIsTableModalOpen,
          }}
        />

        <Divider color="primary" className="my-6" />
      </div>

      {definition.estPerso && (
        <ThematiquesIndicateurInput
          definition={definition}
          disabled={isReadonly}
        />
      )}

      <IndicateurCommentaireInput
        key={commentaire}
        commentaire={commentaire}
        disabled={isReadonly}
        updateCommentaire={updateCommentaire}
      />
    </div>
  );
};

export default DonneesIndicateur;
