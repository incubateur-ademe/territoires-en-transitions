import { canUpdateIndicateur } from '@/app/indicateurs/indicateurs/indicateur-authorization.utils';
import {
  type IndicateurDetaille,
  isIndicateurPerso,
} from '@tet/domain/indicateurs';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import Markdown from '@/app/ui/Markdown';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Tab, Tabs } from '@tet/ui';
import { appLabels } from '@/app/labels/catalog';
import { useIndicateurChartInfo } from '../data/use-indicateur-chart';
import ActionsLiees from './ActionsLiees';
import DonneesIndicateur from './DonneesIndicateur';
import FichesLiees from './FichesLiees';
import IndicateurHeader from './Header/IndicateurHeader';
import SousIndicateurs from './SousIndicateurs';

type IndicateurLayoutProps = {
  dataTest?: string;
  indicateur: IndicateurDetaille;
};

const IndicateurLayout = ({ dataTest, indicateur }: IndicateurLayoutProps) => {
  const {
    enfants,
    sansValeurUtilisateur: sansValeur,
    description,
  } = indicateur;

  const { mutate: updateIndicateur } = useUpdateIndicateur(indicateur.id);
  const { id } = useUser();

  const { collectiviteId, hasCollectivitePermission, isSimplifiedView } =
    useCurrentCollectivite();

  const canMutateIndicateur = canUpdateIndicateur(
    hasCollectivitePermission,
    indicateur,
    id
  );

  const composeSansAgregation = !!enfants && enfants.length > 0 && sansValeur;
  const composeAvecAgregation = !!enfants && enfants.length > 0 && !sansValeur;

  const handleUpdate = (
    fieldName: 'commentaire' | 'unite' | 'titre',
    fieldValue: string
  ) => {
    const trimmedFieldValue = fieldValue.trim();
    const hasValueChanged = trimmedFieldValue !== indicateur[fieldName];

    if (!hasValueChanged) {
      return;
    }

    updateIndicateur({
      [fieldName]: trimmedFieldValue,
    });
  };

  const handleTitreUpdate = (value: string) => handleUpdate('titre', value);
  const handleUniteUpdate = (value: string) => handleUpdate('unite', value);
  const handleCommentaireUpdate = (value: string) => {
    handleUpdate('commentaire', value);
  };

  const chartInfo = useIndicateurChartInfo({ indicateur });

  const enfantsIds = enfants?.map(({ id }) => id) || [];

  const canReadFiches = hasCollectivitePermission('plans.fiches.read');
  const isPerso = isIndicateurPerso(indicateur);

  const displayMesuresLieesVisiteOrPermissionForReferenceIndicateur =
    !isPerso &&
    hasCollectivitePermission('referentiels.read') &&
    !isSimplifiedView;

  return (
    <>
      <IndicateurHeader
        collectiviteId={collectiviteId}
        hasCollectivitePermission={hasCollectivitePermission}
        indicateur={indicateur}
        chartInfo={composeSansAgregation ? undefined : chartInfo}
        isReadonly={!canMutateIndicateur}
        isPerso={isPerso}
        composeSansAgregation={composeSansAgregation}
        onUpdate={handleTitreUpdate}
      />

      <div data-test={dataTest} className="pt-6">
        {composeSansAgregation ? (
          // Groupe d'indicateurs sans agrégation
          <SousIndicateurs
            enfantsIds={enfantsIds}
            isReadonly={!canMutateIndicateur}
          />
        ) : (
          // Indicateur sans enfant, groupe d'indicateurs avec agrégation,
          // ou indicateur personnalisé
          <Tabs tabsListClassName="!justify-start flex-nowrap overflow-x-auto">
            {/* Données */}
            <Tab label="Données">
              <DonneesIndicateur
                indicateur={indicateur}
                chartInfo={chartInfo}
                updateUnite={handleUniteUpdate}
                updateCommentaire={handleCommentaireUpdate}
              />
            </Tab>

            {/* Sous indicateurs */}
            {composeAvecAgregation ? (
              <Tab
                label={`${enfants.length} sous-indicateur${
                  enfants.length > 1 ? 's' : ''
                }`}
              >
                <SousIndicateurs
                  enfantsIds={enfantsIds}
                  isReadonly={!canMutateIndicateur}
                />
              </Tab>
            ) : undefined}

            {displayMesuresLieesVisiteOrPermissionForReferenceIndicateur ? (
              <Tab label="Mesures des référentiels">
                <ActionsLiees
                  isReadonly={!canMutateIndicateur}
                  actionsIds={
                    indicateur.mesures?.map((mesure) => mesure.id) ?? []
                  }
                />
              </Tab>
            ) : undefined}

            {canReadFiches ? (
              <Tab label={appLabels.actionsLiees}>
                <FichesLiees indicateur={indicateur} />
              </Tab>
            ) : undefined}

            {!isPerso && !!description ? (
              <Tab label="Informations sur l’indicateur">
                <Markdown
                  content={description}
                  className="bg-white p-10 border border-grey-3 rounded-xl paragraphe-16 paragraphe-primary-9"
                />
              </Tab>
            ) : undefined}
          </Tabs>
        )}
      </div>
    </>
  );
};

export default IndicateurLayout;
