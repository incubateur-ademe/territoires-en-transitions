import {
  canUpdateIndicateurDefinition,
  canUpdateIndicateurValeur,
} from '@/app/indicateurs/indicateurs/indicateur-definition-authorization.utils';
import {
  type IndicateurDetaille,
  isIndicateurPerso,
} from '@tet/domain/indicateurs';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Divider } from '@tet/ui';
import { useState } from 'react';
import { PersonnalisationQuestionsList } from '../../../../../collectivites/personnalisations/personnalisation-questions.list';
import { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { useIndicateurPersonnalisation } from '../data/use-indicateur-personnalisation';
import IndicateurDetailChart from '../Indicateur/detail/IndicateurDetailChart';
import { IndicateurValuesTabs } from '../Indicateur/detail/IndicateurValuesTabs';
import { IndicateurCommentaireInput } from './indicateur-commentaire.input';
import { IndicateurSourcesSelect } from './indicateur-sources.select';
import { IndicateurUniteInput } from './indicateur-unite.input';
import { ThematiquesIndicateurInput } from './ThematiquesIndicateurInput';
import { TypeSegmentationSelect } from './type-segmentation.select';

type Props = {
  definition: IndicateurDetaille;
  chartInfo: IndicateurChartInfo;
  updateUnite: (value: string) => void;
  updateCommentaire: (value: string) => void;
};

const DonneesIndicateur = ({
  definition,
  chartInfo,
  updateUnite,
  updateCommentaire,
}: Props) => {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const { commentaire, unite } = definition;

  const { sourceFilter, typesSegmentation } = chartInfo;

  const questionReponses = useIndicateurPersonnalisation(
    definition.identifiantReferentiel,
    chartInfo.sourceFilter.valeursReference?.drom ?? false
  );
  const { hasCollectivitePermission } = useCurrentCollectivite();

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

  const isPerso = isIndicateurPerso(definition);

  return (
    <div className="flex flex-col gap-7 bg-white p-10 border border-grey-3 rounded-xl">
      <div className="flex flex-row gap-4">
        {/* Unité personnalisée */}
        {isPerso && (
          <IndicateurUniteInput
            unite={unite}
            updateUnite={updateUnite}
            disabled={!canMutateDefinition}
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
        <PersonnalisationQuestionsList
          questionReponses={questionReponses}
          canEdit={canMutateDefinition}
        />
      )}

      {/* Graphe */}
      <IndicateurDetailChart
        className="mb-6"
        chartInfo={chartInfo}
        definition={definition}
        isReadonly={!canMutateValeur || definition.sansValeurUtilisateur}
        onAddValue={() => setIsTableModalOpen(true)}
      />

      <div className="flex flex-col gap-7">
        <Divider color="primary" className="mb-6" />

        {/* Tableau */}
        <IndicateurValuesTabs
          definition={definition}
          chartInfo={chartInfo}
          isReadonly={!canMutateValeur || definition.sansValeurUtilisateur}
          openModalState={{
            isOpen: isTableModalOpen,
            setIsOpen: setIsTableModalOpen,
          }}
        />

        <Divider color="primary" className="my-6" />
      </div>

      {isPerso && (
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
