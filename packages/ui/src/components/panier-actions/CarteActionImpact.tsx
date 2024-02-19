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
      className="box-content !px-5 !py-4 h-[160px]"
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
        <div className="relative z-0">
          {/* Badge de complexité */}
          <Badge
            title={`Complexité ${valeurToBadge[complexite].nom}`}
            size="sm"
            state={valeurToBadge[complexite].style}
          />

          {/* Boutons d'action, visibles au hover de la carte */}
          <div className="invisible group-hover:visible w-full absolute z-10 bottom-0 right-0 bg-white flex justify-end gap-2">
            {panier ? (
              <Button size="xs" onClick={() => handleToggleSelect(false)}>
                Retirer du panier
              </Button>
            ) : (
              <>
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
                    className={classNames('!px-3', {
                      '!bg-primary-2': statut === 'non_pertinent',
                    })}
                    onClick={() => onUpdateStatus?.('non_pertinent')}
                  >
                    Non pertinente
                  </Button>
                </Tooltip>
                <Button
                  variant="outlined"
                  size="xs"
                  className={classNames('!px-3', {
                    '!bg-primary-2': statut === 'en_cours',
                  })}
                  onClick={() => onUpdateStatus?.('en_cours')}
                >
                  En cours
                </Button>
                <Button
                  variant="outlined"
                  size="xs"
                  className={classNames('!px-3', {
                    '!bg-primary-2': statut === 'realise',
                  })}
                  onClick={() => onUpdateStatus?.('realise')}
                >
                  Réalisée
                </Button>

                <Button
                  size="xs"
                  className="!px-2"
                  onClick={() => handleToggleSelect(true)}
                >
                  Ajouter
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      {titre}
    </Card>
  );
};
