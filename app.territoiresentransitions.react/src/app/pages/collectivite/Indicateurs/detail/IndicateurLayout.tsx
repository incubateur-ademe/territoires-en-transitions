import { Indicateurs } from '@/api';
import { useCurrentCollectivite } from '@/app/collectivites/collectivite-context';
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

  // Mise à jour des champs de l'indicateur
  const handleUpdate = (
    name: 'description' | 'commentaire' | 'unite' | 'titre',
    value: string
  ) => {
    const trimmedValue = value.trim();
    if (collectiviteId && trimmedValue !== definition[name]) {
      const indicateurDefinition: Indicateurs.domain.IndicateurDefinitionUpdate =
        {
          ...definition,
          [name]: trimmedValue,
          confidentiel: definition.confidentiel || false,
        };

      updateDefinition(indicateurDefinition);
    }
  };

  const handleTitreUpdate = (value: string) => handleUpdate('titre', value);

  const handleCommentaireUpdate = (value: string) =>
    handleUpdate('commentaire', value);

  const handleUniteUpdate = (value: string) => handleUpdate('unite', value);

  /**
   * TEMPORARY: currently, description input feeds two columns:
   * `description` column in `indicateur_definition`
   * `commentaire` column in `indicateur_collectivite` (via the hardcoded ['commentaire'] prop).
   *
   * TO DO: remove this function and change
   * handleUpdate('description', e.target.value) to handleUpdate('commentaire', e.target.value).
   *
   * Related to this PR: https://github.com/incubateur-ademe/territoires-en-transitions/pull/3313.
   */
  const handleDescriptionUpdate = (value: string) => {
    const trimmedValue = value.trim();
    updateDefinition({
      ...definition,
      description: trimmedValue,
      commentaire: trimmedValue,
      confidentiel: definition.confidentiel || false,
    });
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
                    updateDescription={(value) =>
                      isPerso
                        ? handleDescriptionUpdate(value)
                        : handleCommentaireUpdate(value)
                    }
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

                {/* Mesures des référentiels liées */}
                {!isPerso ? (
                  <Tab label="Mesures des référentiels liées">
                    <ActionsLiees actionsIds={definition.actions ?? []} />
                  </Tab>
                ) : undefined}

                {/* Fiches des plans liées */}
                <Tab label="Fiches des plans liées">
                  <FichesLiees
                    definition={definition}
                    isReadonly={isReadOnly}
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
