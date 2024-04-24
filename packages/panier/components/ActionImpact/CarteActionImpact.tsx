import classNames from 'classnames';
import {CarteActionImpactProps} from './types';
import {Badge, Button, Card, Tooltip} from '@tet/ui';
import NiveauBudget from './NiveauBudget';

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
      className={classNames('box-content px-4 py-4 h-20', {
        '!cursor-default': panier && !isSelected,
      })}
      isSelected={isSelected}
      footer={
        <div className="relative z-0">
          <div className="flex justify-end opacity-100 group-hover:opacity-0 transition-opacity duration-500">
            {/* Badge thématique */}
            {!!thematiques.length && (
              <Badge title={thematiques[0].nom} size="sm" state="standard" />
            )}
            {/* Budget */}
            <NiveauBudget budget={budget ?? {niveau: 4, nom: 'Non estimé'}} />
          </div>

          {/* Boutons d'action, visibles au hover de la carte */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 w-full absolute z-10 bottom-0 right-0 bg-white flex justify-end gap-2">
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
      <Tooltip label={titre}>
        <span className="line-clamp-1">{titre}</span>
      </Tooltip>
    </Card>
  );
};
