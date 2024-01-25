import {Badge} from '@design-system/Badge';
import {Button} from '@design-system/Button';
import {Card} from '@design-system/Card';
import {Icon} from '@design-system/Icon';
import {Tooltip} from '@design-system/Tooltip';
import classNames from 'classnames';
import {useState} from 'react';

type CarteActionImpactProps = {
  /** Titre de l'action à impact */
  titre: string;
  /** Catégorie de l'action à impact */
  categorie: string;
  /** Niveau de complexité de l'action : simple, intermédiaire ou élevée */
  complexite: 1 | 2 | 3;
  /** Budget de la mise en place de l'action : petit, moyen ou élevé */
  budget: 1 | 2 | 3;
  /** Initialisation de l'état sélectionné de la carte */
  selectionnee?: boolean;
  /** Détecte le changement de statut sélectionné ou non */
  onToggleSelected: (value: boolean) => void;
  /** Détecte le changement de statut de l'action : non pertinent, en cours, réalisé */
  onUpdateStatus: (status: string) => void;
};

/**
 * Carte action à impact du panier d'actions
 */

export const CarteActionImpact = ({
  titre,
  categorie,
  complexite,
  budget,
  selectionnee = false,
  onToggleSelected,
  onUpdateStatus,
}: CarteActionImpactProps) => {
  const [isSelected, setIsSelected] = useState(selectionnee);

  const valeurBadge =
    complexite === 1 ? 'simple' : complexite === 2 ? 'intermédiaire' : 'élevée';

  const etatBadge =
    complexite === 1 ? 'success' : complexite === 2 ? 'warning' : 'error';

  const handleToggleSelect = value => {
    setIsSelected(value);
    onToggleSelected(value);
  };

  return (
    <Card
      style={{maxWidth: '400px'}}
      className="box-content"
      isSelected={isSelected}
      header={
        <div className="flex justify-between">
          {/* Catégorie */}
          <div>{categorie}</div>

          {/* Budget */}
          <div>
            <Icon icon="money-euro-circle-fill" className="text-secondary-1" />
            <Icon
              icon="money-euro-circle-fill"
              className={classNames({
                'text-secondary-1': budget >= 2,
                'text-grey-4': budget < 2,
              })}
            />
            <Icon
              icon="money-euro-circle-fill"
              className={classNames({
                'text-secondary-1': budget === 3,
                'text-grey-4': budget < 3,
              })}
            />
          </div>
        </div>
      }
      footer={
        <div className="flex justify-between items-center relative">
          {/* Badge de complexité */}
          <Badge
            title={`Complexité ${valeurBadge}`}
            size="sm"
            state={etatBadge}
            className={classNames('absolute', {
              'group-hover:hidden': !isSelected,
            })}
          />

          {/* Boutons d'action, visibles au hover de la carte */}
          {isSelected ? (
            <Button
              size="xs"
              className="invisible group-hover:visible ml-auto"
              onClick={() => handleToggleSelect(false)}
            >
              Retirer du panier
            </Button>
          ) : (
            <div className="flex gap-2 invisible group-hover:visible ml-auto">
              <Tooltip
                label={
                  <div className="font-normal text-center w-48">
                    Hors compétence de la collectivité ou non prioritaire
                  </div>
                }
                placement="top"
              >
                <Button
                  variant="outlined"
                  size="xs"
                  className="!px-4"
                  onClick={() => onUpdateStatus('non pertient')}
                >
                  Non pertinent
                </Button>
              </Tooltip>
              <Button
                variant="outlined"
                size="xs"
                className="!px-4"
                onClick={() => onUpdateStatus('en cours')}
              >
                En cours
              </Button>
              <Button
                variant="outlined"
                size="xs"
                className="!px-4"
                onClick={() => onUpdateStatus('réalisé')}
              >
                Réalisé
              </Button>

              <Button
                size="xs"
                className="!px-4"
                onClick={() => handleToggleSelect(true)}
              >
                Ajouter
              </Button>
            </div>
          )}
        </div>
      }
    >
      {titre}
    </Card>
  );
};
