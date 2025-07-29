import { Indicateurs } from '@/api';
import { useCurrentCollectivite } from '@/api/collectivites';
import Markdown from '@/app/ui/Markdown';
import { Tab, Tabs } from '@/ui';
import { useUpdateIndicateurDefinition } from '../Indicateur/useUpdateIndicateurDefinition';
import { TIndicateurDefinition } from '../types';
import ActionsLiees from './ActionsLiees';
import DonneesIndicateur from './DonneesIndicateur';
import FichesLiees from './FichesLiees';
import IndicateurHeader from './Header/IndicateurHeader';
import SousIndicateurs from './SousIndicateurs';

type IndicateurLayoutProps = {
  dataTest?: string;
  definition: TIndicateurDefinition;
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

  const { mutate: updateDefinition } = useUpdateIndicateurDefinition();

  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  const composeSansAgregation = !!enfants && enfants.length > 0 && sansValeur;
  const composeAvecAgregation = !!enfants && enfants.length > 0 && !sansValeur;

  const handleUpdate = (
    name: 'description' | 'commentaire' | 'unite' | 'titre',
    value: string
  ) => {
    const trimmedValue = value.trim();
    const isFieldUpdated = trimmedValue !== definition[name];
    if (isFieldUpdated === false) {
      return;
    }
    const indicateurDefinition: Indicateurs.domain.IndicateurDefinitionUpdate =
      {
        ...definition,
        [name]: trimmedValue,
        confidentiel: definition.confidentiel || false,
      };

    updateDefinition(indicateurDefinition);
  };

  const handleTitreUpdate = (value: string) => handleUpdate('titre', value);

  const handleUniteUpdate = (value: string) => handleUpdate('unite', value);

  const handleCommentaireUpdate = (value: string) => {
    handleUpdate('commentaire', value);
  };

  const enfantsIds = enfants?.map(({ id }) => id) || [];

  return (
    <div className="bg-grey-2 grow">
      <div className="py-12">
        <IndicateurHeader
          collectiviteId={collectiviteId}
          definition={definition}
          isReadonly={isReadOnly}
          isPerso={isPerso}
          composeSansAgregation={composeSansAgregation}
          onUpdate={handleTitreUpdate}
        />

        <div data-test={dataTest} className="w-full px-2 md:px-4 lg:px-6">
          <div className="w-full px-2 mx-auto xl:max-w-7xl 2xl:max-w-8xl">
            {composeSansAgregation ? (
              // Groupe d'indicateurs sans agrégation
              <SousIndicateurs
                enfantsIds={enfantsIds}
                isReadonly={isReadOnly}
              />
            ) : (
              // Indicateur sans enfant, groupe d'indicateurs avec agrégation,
              // ou indicateur personnalisé
              <Tabs tabsListClassName="!justify-start flex-nowrap overflow-x-auto">
                {/* Données */}
                <Tab label="Données">
                  <DonneesIndicateur
                    {...{ definition, isPerso, isReadOnly }}
                    updateUnite={handleUniteUpdate}
                    updateDescription={handleCommentaireUpdate}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndicateurLayout;
