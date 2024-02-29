import {Badge} from '@design-system/Badge';
import {Button} from '@design-system/Button';
import {Modal, ModalFooter, ModalFooterSection} from '@design-system/Modal';
// import {Icon} from '@design-system/Icon';
import {NiveauBudget} from './NiveauBudget';
import {valeurToBadge} from './utils';
import {ModaleActionImpactProps} from './types';
import classNames from 'classnames';

/**
 * Modale action à impact du panier d'actions
 */

export const ModaleActionImpact = ({
  children,
  titre,
  thematiques,
  complexite,
  budget,
  description,
  nbCollectivitesEnCours,
  nbCollectivitesRealise,
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
          <div className="flex justify-between mb-6 mt-4">
            {/* Catégorie */}
            <div className="text-primary-8 text-lg font-bold flex divide-x-2 divide-x-primary-3 gap-x-3">
              {thematiques.map(them => (
                <div key={them.id} className="pl-3 first-of-type:pl-0">
                  {them.nom}
                </div>
              ))}
            </div>

            {/* Budget */}
            <NiveauBudget budget={budget} />
          </div>

          {/* Titre de l'action */}
          <h3>{titre}</h3>

          {/* Badge de complexité */}
          <Badge
            title={`Complexité ${valeurToBadge[complexite].nom}`}
            size="sm"
            state={valeurToBadge[complexite].style}
          />

          {/* Description */}
          <p className="paragraphe-18 mt-6">{description}</p>

          {/* Ressources externes */}
          {/* {!!ressources && (
            <div className="flex items-center gap-2">
              <Icon
                icon="external-link-line"
                size="lg"
                className="text-primary-4"
              />
              <a
                href={ressources}
                className="text-primary-10 font-bold bg-none active:!bg-transparent after:hidden border-b border-primary-10 hover:border-b-2 p-px hover:pb-0"
                target="_blank"
                rel="noreferrer noopener"
              >
                Consulter les ressources externes
              </a>
            </div>
          )} */}

          {/* Collectivités sur la même action */}
          {(!!nbCollectivitesEnCours || !!nbCollectivitesRealise) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-6">
              {!!nbCollectivitesEnCours && (
                <div className="text-primary-9 text-sm font-medium border border-grey-3 rounded-md px-6 py-5 shadow">
                  <span className="font-bold">
                    {nbCollectivitesEnCours} collectivités
                  </span>{' '}
                  sont en cours sur cette action
                </div>
              )}

              {!!nbCollectivitesRealise && (
                <div className="text-primary-9 text-sm font-medium border border-grey-3 rounded-md px-6 py-5 shadow">
                  <span className="font-bold">
                    {nbCollectivitesRealise} collectivités
                  </span>{' '}
                  ont réalisé cette action
                </div>
              )}
            </div>
          )}
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
