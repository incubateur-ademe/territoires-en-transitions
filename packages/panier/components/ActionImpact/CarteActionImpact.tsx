import classNames from 'classnames';
import {CarteActionImpactProps} from './types';
import {Badge, Button, Card} from '@tet/ui';
import NiveauBudget from './NiveauBudget';

const maxLength = 120;

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
  budget,
  panier,
  isSelected,
  statut,
  onToggleSelected,
  onUpdateStatus,
}: CarteActionImpactProps) => {
  const handleToggleSelect = (value: boolean) => onToggleSelected(value);

  return (
    <Card
      className={classNames('box-content !px-5 !py-4 h-[160px]', {
        '!cursor-default': panier && !isSelected,
      })}
      isSelected={isSelected}
      header={
        <div className="flex justify-end">
          {/* Budget */}
          <NiveauBudget budget={budget ?? {niveau: 4, nom: 'Non estimé'}} />
        </div>
      }
      footer={
        <div className="relative z-0">
          {/* Badge thématique */}
          {!!thematiques.length && (
            <Badge title={thematiques[0].nom} size="sm" state="standard" />
          )}

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
                  Ajouter au panier
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
