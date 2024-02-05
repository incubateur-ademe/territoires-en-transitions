import {Badge} from '@design-system/Badge';
import {Button} from '@design-system/Button';
import {Card} from '@design-system/Card';
import {Tooltip} from '@design-system/Tooltip';
import classNames from 'classnames';
import {valeurToBadge} from './utils';
import {NiveauBudget} from './NiveauBudget';
import {CarteActionImpactProps} from './types';

/**
 * Carte action à impact du panier d'actions
 */

export const CarteActionImpact = ({
  titre,
  categorie,
  complexite,
  budget,
  isSelected,
  onToggleSelected,
  onUpdateStatus,
}: CarteActionImpactProps) => {
  const handleToggleSelect = value => onToggleSelected(value);

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
          <NiveauBudget budget={budget} />
        </div>
      }
      footer={
        <div className="flex justify-between items-center relative">
          {/* Badge de complexité */}
          <Badge
            title={`Complexité ${valeurToBadge[complexite].nom}`}
            size="sm"
            state={valeurToBadge[complexite].style}
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
