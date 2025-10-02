import { useCurrentCollectivite } from '@/api/collectivites';
import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { useUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/use-update-indicateur-definition';
import Markdown from '@/app/ui/Markdown';
import { Tab, Tabs } from '@/ui';
import ActionsLiees from './ActionsLiees';
import DonneesIndicateur from './DonneesIndicateur';
import FichesLiees from './FichesLiees';
import IndicateurHeader from './Header/IndicateurHeader';
import SousIndicateurs from './SousIndicateurs';

type IndicateurLayoutProps = {
  dataTest?: string;
  definition: IndicateurDefinition;
};

const IndicateurLayout = ({ dataTest, definition }: IndicateurLayoutProps) => {
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
    <>
      <IndicateurHeader
        collectiviteId={collectiviteId}
        definition={definition}
        isReadonly={isReadOnly}
        isPerso={definition.estPerso}
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
                {...{ definition, isReadOnly }}
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

            {!definition.estPerso ? (
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

            {!definition.estPerso && !!description ? (
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
