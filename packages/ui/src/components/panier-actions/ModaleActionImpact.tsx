import classNames from 'classnames';
import {Badge} from '@design-system/Badge';
import {Button} from '@design-system/Button';
import {Divider} from '@design-system/Divider';
import {Modal, ModalFooter, ModalFooterSection} from '@design-system/Modal';
import {InfoTooltip} from '@design-system/Tooltip';
import {NiveauBudget} from './NiveauBudget';
import {ModaleActionImpactProps} from './types';
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
          <p className="paragraphe-18">{description}</p>

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
