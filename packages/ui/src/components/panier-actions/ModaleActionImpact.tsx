import classNames from 'classnames';
import {Badge} from '@design-system/Badge';
import {Button} from '@design-system/Button';
import {Divider} from '@design-system/Divider';
import {Icon} from '@design-system/Icon';
import {Modal, ModalFooter, ModalFooterSection} from '@design-system/Modal';
import {Tooltip} from '@design-system/Tooltip';
import {NiveauBudget} from './NiveauBudget';
import {valeurToBadge} from './utils';
import {ModaleActionImpactProps} from './types';
import LienExterneModale from './LienExterneModale';

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

          <Divider className="mt-4" />

          {/* Subventions mobilisables */}
          <div className="mt-2">
            <h6 className="text-primary-10 text-base font-bold">
              Subventions mobilisables :{' '}
              <Tooltip
                label={
                  <div className="w-52 !font-normal">
                    De nombreux programmes d’aides nationaux et locaux peuvent
                    vous permettre de financer ou d’accompagner vos projets. Les
                    liens directs vers les programmes concernés seront
                    prochainement disponibles sur la plateforme.
                  </div>
                }
              >
                <span>
                  <Icon
                    icon="file-info-line"
                    size="sm"
                    className="text-grey-5 ml-1"
                  />
                </span>
              </Tooltip>
            </h6>
            <div className="flex gap-8">
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
