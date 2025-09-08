import { useCurrentCollectivite } from '@/api/collectivites';
import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-indicateur-definition';
import Markdown from '@/app/ui/Markdown';
import { Tab, Tabs } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { useUpdateIndicateurDefinition } from '../../../../../indicateurs/definitions/use-update-indicateur-definition';
import ActionsLiees from './ActionsLiees';
import DonneesIndicateur from './DonneesIndicateur';
import FichesLiees from './FichesLiees';
import IndicateurHeader from './Header/IndicateurHeader';
import SousIndicateurs from './SousIndicateurs';

type IndicateurLayoutProps = {
  dataTest?: string;
  definition: IndicateurDefinition;
  isPerso?: boolean;
};

const IndicateurLayout = ({
  dataTest,
  definition,
  isPerso = false,
}: IndicateurLayoutProps) => {
  const {
    enfants,
    sansValeurUtilisateur: sansValeur,
    description,
  } = definition;

  const { mutate: updateIndicateur } = useUpdateIndicateurDefinition(
    definition.id
  );

  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  const composeSansAgregation = !!enfants && enfants.length > 0 && sansValeur;
  const composeAvecAgregation = !!enfants && enfants.length > 0 && !sansValeur;

  const handleUpdate = (
    fieldName: 'commentaire' | 'unite' | 'titre',
    fieldValue: string
  ) => {
    const trimmedFieldValue = fieldValue.trim();
    const hasValueChanged = trimmedFieldValue !== definition[fieldName];

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

  const enfantsIds = enfants?.map(({ id }) => id) || [];

  return (
    <div className="py-12 bg-grey-2 grow">
      <IndicateurHeader
        collectiviteId={collectiviteId}
        definition={definition}
        isReadonly={isReadOnly}
        isPerso={isPerso}
        composeSansAgregation={composeSansAgregation}
        onUpdate={handleTitreUpdate}
      />

      <PageContainer dataTest={dataTest} innerContainerClassName="pt-6">
        {composeSansAgregation ? (
          // Groupe d'indicateurs sans agrégation
          <SousIndicateurs enfantsIds={enfantsIds} isReadonly={isReadOnly} />
        ) : (
          // Indicateur sans enfant, groupe d'indicateurs avec agrégation,
          // ou indicateur personnalisé
          <Tabs tabsListClassName="!justify-start flex-nowrap overflow-x-auto">
            {/* Données */}
            <Tab label="Données">
              <DonneesIndicateur
                {...{ definition, isPerso, isReadOnly }}
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
                  isReadonly={isReadOnly}
                />
              </Tab>
            ) : undefined}

            {!isPerso ? (
              <Tab label="Mesures des référentiels">
                <ActionsLiees
                  actionsIds={
                    definition.mesures?.map((mesure) => mesure.id) ?? []
                  }
                />
              </Tab>
            ) : undefined}

            <Tab label="Fiches action">
              <FichesLiees
                definition={definition}
                isReadonly={isReadOnly}
                collectiviteId={collectiviteId}
              />
            </Tab>

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
      </PageContainer>
    </div>
  );
};

export default IndicateurLayout;
