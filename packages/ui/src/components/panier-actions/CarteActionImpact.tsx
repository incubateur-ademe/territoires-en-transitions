import {Badge} from '@design-system/Badge';
import {Button} from '@design-system/Button';
import {Card} from '@design-system/Card';
import classNames from 'classnames';
import {valeurToBadge} from './utils';
import {NiveauBudget} from './NiveauBudget';
import {CarteActionImpactProps} from './types';

const maxLength = 130;

const splitTitle = (title: string) => {
  let newContent = title.slice(0, maxLength);
  const contentEnd = title.slice(maxLength).split(' ')[0];
  newContent += contentEnd;
  return newContent;
};

/**
 * Carte action à impact du panier d'actions
 */

export const CarteActionImpact = ({
  titre,
  thematiques,
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
          <div>{thematiques[0]?.nom ?? ''}</div>

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
                <Button
                  variant="outlined"
                  size="xs"
                  className={classNames({
                    '!bg-primary-2': statut === 'en_cours',
                  })}
                  onClick={() => onUpdateStatus?.('en_cours')}
                >
                  En cours
                </Button>
                <Button
                  variant="outlined"
                  size="xs"
                  className={classNames({
                    '!bg-primary-2': statut === 'realise',
                  })}
                  onClick={() => onUpdateStatus?.('realise')}
                >
                  Réalisée
                </Button>

                <Button size="xs" onClick={() => handleToggleSelect(true)}>
                  Ajouter
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      {titre.length > maxLength ? `${splitTitle(titre)}...` : titre}
    </Card>
  );
};
