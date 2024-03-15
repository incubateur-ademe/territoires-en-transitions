/* eslint-disable react/no-unescaped-entities */
import classNames from 'classnames';
import {ModaleActionImpactProps} from './types';
import {
  Badge,
  Button,
  Divider,
  InfoTooltip,
  Modal,
  ModalFooter,
  ModalFooterSection,
} from '@tet/ui';
import NiveauBudget from './NiveauBudget';
import LienExterneModale from './LienExterneModale';

/**
 * Modale action à impact du panier d'actions
 */

export const ModaleActionImpact = ({
  children,
  titre,
  thematiques,
  budget,
  description,
  miseEnOeuvre,
  ressources,
  statut,
  panier,
  onToggleSelected,
  onUpdateStatus,
}: ModaleActionImpactProps) => {
  return (
    <Modal
      size="lg"
      render={() => (
        <div>
          <div className="flex justify-end mb-6 mt-4">
            {/* Budget */}
            <NiveauBudget budget={budget} />
          </div>

          {/* Titre de l'action */}
          <h3>{titre}</h3>

          {/* Badges thématiques */}
          {!!thematiques.length && (
            <div className="flex gap-4 flex-wrap mb-6">
              {thematiques.map(theme => (
                <Badge
                  key={theme.id}
                  title={theme.nom}
                  size="sm"
                  state="standard"
                />
              ))}
            </div>
          )}

          {/* Description */}
          <p className="paragraphe-18 mb-8">{description}</p>

          {/* Temps de mise en oeuvre */}
          <p className="text-base text-primary-10 font-bold mb-8">
            Temps de mise en oeuvre :{' '}
            <span className="text-primary-8">
              {miseEnOeuvre ?? 'non estimé'}
            </span>
            <InfoTooltip
              className="ml-2"
              label={
                <div className="w-52 !font-normal">
                  Temps estimatif correspondant au déploiement de l’action une
                  fois validée, de son démarrage à ses premières réalisations.
                  Cette temporalité peut varier en fonction des priorisations,
                  des moyens et des ressources disponibles.
                </div>
              }
            />
          </p>

          {/* Ressources externes */}
          {!!ressources && (
            <div className="flex gap-x-8 gap-y-3 flex-wrap pb-8">
              <LienExterneModale
                label="Consulter les ressources externes"
                href=""
              />
            </div>
          )}

          <Divider className="mt-4" />

          {/* REX */}
          <div className="mt-2">
            <h6 className="text-primary-10 text-base font-bold">
              D’autres collectivités l’ont fait :
            </h6>
            <div className="flex gap-x-8 gap-y-3 flex-wrap pb-8">
              <span className="text-sm text-grey-7">
                Exemples d'autres collectivités à venir
              </span>
            </div>
          </div>

          <Divider className="mt-4" />

          {/* Subventions mobilisables */}
          <div className="mt-2">
            <h6 className="text-primary-10 text-base font-bold">
              Subventions mobilisables :{' '}
              <InfoTooltip
                className="ml-1"
                label={
                  <div className="w-52 !font-normal">
                    De nombreux programmes d’aides nationaux et locaux peuvent
                    vous permettre de financer ou d’accompagner vos projets. Les
                    liens directs vers les programmes concernés seront
                    prochainement disponibles sur la plateforme.
                  </div>
                }
              />
            </h6>
            <div className="flex gap-x-8 gap-y-3 flex-wrap">
              <LienExterneModale
                label="Aides territoires"
                href="https://aides-territoires.beta.gouv.fr"
              />
            </div>
          </div>
        </div>
      )}
      renderFooter={({close}) => (
        <ModalFooter variant="space">
          <ModalFooterSection>
            <Button
              variant="outlined"
              className={classNames({
                'bg-primary-2': statut === 'en_cours',
              })}
              onClick={() => {
                onUpdateStatus?.('en_cours');
                close();
              }}
            >
              En cours
            </Button>
            <Button
              variant="outlined"
              className={classNames({
                'bg-primary-2': statut === 'realise',
              })}
              onClick={() => {
                onUpdateStatus?.('realise');
                close();
              }}
            >
              Réalisée
            </Button>
          </ModalFooterSection>
          <Button
            icon={panier ? 'file-reduce-fill' : 'file-add-fill'}
            onClick={() => {
              onToggleSelected(!panier);
              close();
            }}
          >
            {panier ? 'Retirer du panier' : 'Ajouter au panier'}
          </Button>
        </ModalFooter>
      )}
    >
      {children}
    </Modal>
  );
};
