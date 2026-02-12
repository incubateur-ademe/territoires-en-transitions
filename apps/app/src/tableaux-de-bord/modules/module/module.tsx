import React from 'react';

import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import DEPRECATED_FilterBadges, {
  BadgeFilters,
  useFiltersToBadges,
} from '@/app/ui/lists/DEPRECATED_filter-badges';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  Button,
  ButtonMenu,
  ButtonProps,
  EmptyCard,
  InfoTooltip,
  MenuAction,
} from '@tet/ui';
import { ModuleContainer } from './module.container';
import { ModuleError } from './module.error';

export type ModuleProps = {
  /** Titre du module */
  title: string;
  /** Texte à afficher quand on survole une icone d'info ajoutée à côté du titre */
  titleTooltip?: string;
  /** Symbole du module (picto svg) */
  symbole?: React.ReactNode;
  /** État de chargement */
  isLoading: boolean;
  /** État vide */
  isEmpty: boolean;
  /** État de d'erreur générique */
  isError?: boolean;
  /** Filtres du module */
  filters?: BadgeFilters;
  /** Actions disponnible dans le menu en haut à droite du module */
  menuActions?: MenuAction[];
  /** Bouton à afficher dans l'état vide */
  emptyButtons?: ButtonProps[];
  /** Bouton à afficher dans l'état erreur */
  errorButtons?: ButtonProps[];
  /** ReactNode placé au début du footer */
  footerStartElement?: React.ReactNode;
  /** Des boutons optionnels dans un fragment qui s'affichent à la fin du footer */
  footerEndButtons?: ButtonProps[];
  /** Le contenu principal du module */
  children: React.ReactNode;
  /** Classe donnée au container afin d'appliquer par exemple
   * le nombre de colonne à remplir dans la grille */
  className?: string;
};

/** Générique - Carte d'un module pour tableau de bord */
const Module = ({
  title,
  titleTooltip,
  symbole,
  isLoading,
  isEmpty,
  isError,
  filters: filtre = {},
  emptyButtons,
  errorButtons,
  menuActions,
  footerStartElement,
  footerEndButtons,
  children,
  className,
}: ModuleProps) => {
  const collectiviteId = useCollectiviteId();
  const { totalCount: plansCount } = useListPlans(collectiviteId);

  const { data: filterBadges } = useFiltersToBadges({
    filters: filtre,
    customValues: {
      planActions:
        filtre.planActionIds?.length === plansCount && 'Tous les plans',
    },
  });

  if (isLoading) {
    return (
      <ModuleContainer className={className}>
        <SpinnerLoader className="m-auto" />
      </ModuleContainer>
    );
  }

  if (isError) {
    return (
      <ModuleError
        className={className}
        title={title}
        errorButtons={errorButtons}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyCard
        picto={() => symbole}
        title={title}
        description="Aucun résultat"
        tags={filterBadges}
        actions={emptyButtons}
        className={className}
      />
    );
  }

  return (
    <ModuleContainer className={className}>
      <div className="flex justify-between items-start gap-2">
        {/** Titre */}
        <h6 className="mb-0">
          {title}
          {titleTooltip && (
            <InfoTooltip
              iconClassName="ml-2"
              label={
                <div className="max-w-sm !font-normal leading-none">
                  {titleTooltip}
                </div>
              }
            />
          )}
        </h6>
        {/** Menu */}
        {menuActions && menuActions.length > 0 && (
          <ButtonMenu
            icon="more-line"
            variant="grey"
            size="xs"
            menu={{ actions: menuActions }}
          />
        )}
      </div>
      {/** Filtres du module */}
      <DEPRECATED_FilterBadges
        maxDisplayedFilterCount={1}
        badges={filterBadges}
      />
      {/** Contenu principal */}
      <div className="flex-grow">{children}</div>
      {/** Footer */}
      {(footerStartElement || footerEndButtons) && (
        <div className="mt-auto flex items-center justify-between">
          {footerStartElement}
          {footerEndButtons && footerEndButtons.length > 0 && (
            <div className="ml-auto flex items-center gap-4">
              {footerEndButtons.map((button, index) => (
                <Button key={index} {...button} />
              ))}
            </div>
          )}
        </div>
      )}
    </ModuleContainer>
  );
};

export default Module;
