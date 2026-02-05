import {
  canUpdateIndicateurDefinition,
  canUpdateIndicateurValeur,
} from '@/app/indicateurs/indicateurs/indicateur-definition-authorization.utils';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { QuestionReponseList } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentielQR';
import { useChangeReponseHandler } from '@/app/referentiels/personnalisations/PersoPotentielModal/useChangeReponseHandler';
import { useUser } from '@tet/api';
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
  updateUnite: (value: string) => void;
  updateCommentaire: (value: string) => void;
};

const DonneesIndicateur = ({
  definition,
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
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const user = useUser();

  const canMutateDefinition = canUpdateIndicateurDefinition(
    hasCollectivitePermission,
    definition,
    user.id
  );

  const canMutateValeur = canUpdateIndicateurValeur(
    hasCollectivitePermission,
    definition,
    user.id
  );

  const handleChange = useChangeReponseHandler(collectiviteId, []);

  return (
    <div className="flex flex-col gap-7 bg-white p-10 border border-grey-3 rounded-xl">
      <div className="flex flex-row gap-4">
        {/* Unité personnalisée */}
        {definition.estPerso && (
          <IndicateurUniteInput
            unite={unite}
            updateUnite={updateUnite}
            disabled={!canMutateDefinition}
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
          canEdit={canMutateDefinition}
        />
      )}

      {/* Graphe */}
      <IndicateurDetailChart
        className="mb-6"
        chartInfo={chartInfo}
        definition={definition}
        isReadonly={!canMutateDefinition}
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
          isReadonly={!canMutateValeur}
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
          disabled={!canMutateDefinition}
        />
      )}

      <IndicateurCommentaireInput
        key={commentaire}
        commentaire={commentaire}
        disabled={!canMutateDefinition}
        updateCommentaire={updateCommentaire}
      />
    </div>
  );
};

export default DonneesIndicateur;
