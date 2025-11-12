import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-context/user-provider';
import { canUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/indicateur-definition-authorization.utils';
import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { useUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/use-update-indicateur-definition';
import Markdown from '@/app/ui/Markdown';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
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
  const { id } = useUser();

  const { collectiviteId, permissions, niveauAcces } = useCurrentCollectivite();

  const isReadOnly = !canUpdateIndicateurDefinition(
    permissions,
    definition,
    id
  );

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

  const displayFichesLieesVisiteOrPermission =
    hasPermission(permissions, 'plans.fiches.read') ||
    (!niveauAcces && hasPermission(permissions, 'plans.fiches.read_public'));
  const displayMesuresLieesVisiteOrPermissionForReferenceIndicateur =
    !definition.estPerso &&
    (hasPermission(permissions, 'referentiels.read') ||
      (!niveauAcces && hasPermission(permissions, 'referentiels.read_public')));

  return (
    <>
      <IndicateurHeader
        collectiviteId={collectiviteId}
        permissions={permissions}
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
                definition={definition}
                isReadonly={isReadOnly}
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

            {displayMesuresLieesVisiteOrPermissionForReferenceIndicateur ? (
              <Tab label="Mesures des référentiels">
                <ActionsLiees
                  isReadonly={isReadOnly}
                  actionsIds={
                    definition.mesures?.map((mesure) => mesure.id) ?? []
                  }
                />
              </Tab>
            ) : undefined}

            {displayFichesLieesVisiteOrPermission ? (
              <Tab label="Fiches action">
                <FichesLiees
                  definition={definition}
                  isReadonly={isReadOnly}
                  permissions={permissions}
                  collectiviteId={collectiviteId}
                />
              </Tab>
            ) : undefined}

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
