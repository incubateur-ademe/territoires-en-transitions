import {Badge} from '@design-system/Badge';
import {Button} from '@design-system/Button';
import {Modal, ModalFooter, ModalFooterSection} from '@design-system/Modal';
import {Icon} from '@design-system/Icon';
import {NiveauBudget} from './NiveauBudget';
import {valeurToBadge} from './utils';

type ModaleActionImpactProps = {
  /** Composant enfant */
  children: JSX.Element;
  /** Titre de l'action à impact */
  titre: string;
  /** Catégorie de l'action à impact */
  categorie: string;
  /** Niveau de complexité de l'action : simple, intermédiaire ou élevée */
  complexite: 1 | 2 | 3;
  /** Budget de la mise en place de l'action : petit, moyen ou élevé */
  budget: 1 | 2 | 3;
  /** Description de l'action à impact */
  description: string;
  /** Lien vers les ressources externes */
  ressources?: string;
  /** Nombre de collectivités en train de faire l'action */
  nbCollectivitesEnCours?: number;
  /** Nombre de collectivités ayant fait l'action */
  nbCollectivitesRealise?: number;
  /** Initialisation de l'état sélectionné de la carte */
  selectionnee?: boolean;
  /** Détecte le changement de statut sélectionné ou non */
  onToggleSelected: (value: boolean) => void;
  /** Détecte le changement de statut de l'action : non pertinent, en cours, réalisé */
  updateStatus: (status: string) => void;
};

export const ModaleActionImpact = ({
  children,
  titre,
  categorie,
  complexite,
  budget,
  description,
  ressources,
  nbCollectivitesEnCours,
  nbCollectivitesRealise,
  selectionnee,
  onToggleSelected,
  updateStatus,
}: ModaleActionImpactProps) => {
  return (
    <Modal
      size="lg"
      render={() => (
        <div>
          <div className="flex justify-between mb-6 mt-4">
            {/* Catégorie */}
            <div className="text-primary-8 text-lg font-bold">{categorie}</div>

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
          {!!ressources && (
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
          )}

          {/* Collectivités sur la même action */}
          {(!!nbCollectivitesEnCours || !!nbCollectivitesRealise) && (
            <div className="grid grid-cols-2 gap-8 my-6">
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
              onClick={() => {
                updateStatus('non pertinent');
                close();
              }}
            >
              Non pertinent
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                updateStatus('en cours');
                close();
              }}
            >
              En cours
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                updateStatus('réalisé');
                close();
              }}
            >
              Réalisé
            </Button>
          </ModalFooterSection>
          <Button
            icon={selectionnee ? 'file-reduce-fill' : 'file-add-fill'}
            onClick={() => {
              onToggleSelected(!selectionnee);
              close();
            }}
          >
            {selectionnee ? 'Retirer du panier' : 'Ajouter'}
          </Button>
        </ModalFooter>
      )}
    >
      {children}
    </Modal>
  );
};
