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
  panier,
  isSelected,
  statut,
  onToggleSelected,
  onUpdateStatus,
}: CarteActionImpactProps) => {
  const handleToggleSelect = value => onToggleSelected(value);

  return (
    <Card
      className="box-content !px-5 !py-4 lg:min-h-[165px]"
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
              'group-hover:hidden': !panier || (panier && !isSelected),
            })}
          />

          {/* Boutons d'action, visibles au hover de la carte */}
          {panier ? (
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
                  className={classNames('!px-2', {
                    '!bg-primary-3': statut === 'non_pertinent',
                  })}
                  onClick={() => onUpdateStatus?.('non_pertient')}
                >
                  Non pertinent
                </Button>
              </Tooltip>
              <Button
                variant="outlined"
                size="xs"
                className={classNames('!px-2', {
                  '!bg-primary-3': statut === 'en_cours',
                })}
                onClick={() => onUpdateStatus?.('en_cours')}
              >
                En cours
              </Button>
              <Button
                variant="outlined"
                size="xs"
                className={classNames('!px-2', {
                  '!bg-primary-3': statut === 'realise',
                })}
                onClick={() => onUpdateStatus?.('realise')}
              >
                Réalisé
              </Button>

              <Button
                size="xs"
                className="!px-2"
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
