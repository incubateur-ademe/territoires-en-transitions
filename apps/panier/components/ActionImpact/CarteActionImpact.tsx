import { Badge, Button, Card, Icon } from '@tet/ui';
import classNames from 'classnames';
import NiveauBudget from './NiveauBudget';
import { CarteActionImpactProps } from './types';

/**
 * Carte action à impact du panier d'actions
 */

export const CarteActionImpact = ({
  titre,
  thematiques,
  typologie,
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
      className={classNames('box-content px-4 py-4 h-28 cursor-default')}
      isSelected={isSelected}
      footer={
        <div className="relative z-0">
          {!!typologie && (
            <p className="mb-2 text-sm text-grey-7">{typologie.nom}</p>
          )}
          <div className="flex justify-end items-center gap-2 opacity-100 group-hover:opacity-0 transition-opacity duration-500">
            {/* Badge thématique */}
            {!!thematiques.length && (
              <Badge title={thematiques[0].nom} size="sm" state="standard" />
            )}
            {/* Budget */}
            <NiveauBudget budget={budget ?? { niveau: 1, nom: 'Non estimé' }} />
          </div>

          {/* Boutons d'action, visibles au hover de la carte */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 w-full absolute z-10 bottom-0 right-0 bg-white flex flex-col items-end gap-2">
            {panier ? (
              <Button size="xs" onClick={() => handleToggleSelect(false)}>
                Retirer du panier
              </Button>
            ) : (
              <div className="flex flex-row gap-2 h-10">
                {statut === 'en_cours' || statut === 'realise' ? (
                  <Button size="xs" onClick={() => onUpdateStatus?.(statut)}>
                    Retirer des actions{' '}
                    {statut === 'realise' ? 'réalisées' : 'en cours'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      size="xs"
                      onClick={() => onUpdateStatus?.('en_cours')}
                    >
                      En cours
                    </Button>
                    <Button
                      variant="outlined"
                      size="xs"
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
            )}
            <span className="text-xs font-medium -mb-1">
              <Icon icon="eye-line" size="xs" className="mr-1" />
              Voir le détail de l'action
            </span>
          </div>
        </div>
      }
    >
      <span className="line-clamp-3">{titre}</span>
    </Card>
  );
};
