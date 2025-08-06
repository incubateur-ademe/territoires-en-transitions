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
    name: 'description' | 'unite' | 'titre',
    value: string
  ) => {
    const trimmedValue = value.trim();
    const isFieldUpdated = trimmedValue !== definition[name];
    if (isFieldUpdated === false) {
      return;
    }
    const indicateurDefinition = {
      ...definition,
      collectiviteId: collectiviteId,
      [name]: trimmedValue,
      confidentiel: definition.confidentiel || false,
    };

    updateDefinition({
      indicateurId: indicateurDefinition.id,
      indicateurFields: {
        description: indicateurDefinition.description,
        unite: indicateurDefinition.unite,
        titre: indicateurDefinition.titre,
        collectiviteId: indicateurDefinition.collectiviteId,
        modifiedBy: definition.modifiedBy?.id,
      },
    });
  };

  const handleTitreUpdate = (value: string) => handleUpdate('titre', value);

  const handleUniteUpdate = (value: string) => handleUpdate('unite', value);

  const handleDescriptionUpdate = (value: string) => {
    handleUpdate('description', value);
  };

  const enfantsIds = enfants?.map(({ id }) => id) || [];

  return (
    <>
      <IndicateurHeader
        collectiviteId={collectiviteId}
        definition={definition}
        isReadonly={isReadOnly}
        isPerso={isPerso}
        composeSansAgregation={composeSansAgregation}
        onUpdate={handleTitreUpdate}
      />

      <div data-test={dataTest} className="pt-6">
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
                updateDescription={handleDescriptionUpdate}
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
    </>
  );
};

export default IndicateurLayout;
