import { Button, cn, Icon, Tooltip } from '@tet/ui';
import { PlanDisplayOptionsEnum } from '../plan-options.context';
import { AxeIndicateursPanel } from './axe-indicateurs.panel';
import { AxeMenuButton } from './axe-menu.button';
import { AxeTitleInput } from './axe-title.input';
import { useAxeContext } from './axe.context';

export const AxeHeader = () => {
  const {
    createFicheResume,
    isMainAxe,
    isReadOnly,
    isOpen,
    setIsOpen,
    isOpenPanelIndicateurs,
    isOpenEditTitle,
    setIsOpenEditTitle,
    planOptions,
    providerProps,
  } = useAxeContext();
  const { axe } = providerProps;

  const axeFontColor = cn({
    'text-primary-8 disabled:text-primary-10': isMainAxe,
    'text-grey-8 disabled:text-grey-7': !isMainAxe,
  });

  return (
    <div
      role="heading"
      aria-level={axe.depth}
      className={cn(
        'relative py-2 pr-4 pl-2 overflow-hidden rounded-md hover:bg-grey-2 group/heading',
        { 'rounded-b-none': isOpen }
      )}
    >
      <div className="flex content-between group/title">
        {/** Titre + picto permettant d'ouvrir/fermer l'axe */}
        <button
          type="button"
          disabled={isOpenEditTitle}
          className="flex grow hover:!bg-transparent active:!bg-transparent"
          onClick={(e) => {
            // shift-click passe le titre en mode édition
            if (e.shiftKey && !isReadOnly && !isOpenEditTitle) {
              setIsOpenEditTitle(true);
            }
            // ne permet pas de refermer l'axe si le volet "associer des
            // indicateurs" est ouvert ou si l'édition du titre est en cours
            // (évite l'ouverture/fermeture involontaire de l'axe)
            else if (!isOpenPanelIndicateurs && !isOpenEditTitle) {
              setIsOpen(!isOpen);
            }
          }}
          onKeyDown={(e) => {
            if (
              e.shiftKey &&
              e.code === 'Enter' &&
              !isReadOnly &&
              !isOpenEditTitle
            ) {
              e.preventDefault();
              setIsOpenEditTitle(true);
            }
          }}
          title="Cliquer pour ouvrir/fermer l'axe. Shift+clic pour éditer le titre."
        >
          {/** Picto flèche reflétant l'état d'ouverture de l'axe */}
          <div
            className={cn('self-center mr-2', {
              'rotate-90': isOpen,
            })}
          >
            <Icon
              icon="arrow-right-s-line"
              size="lg"
              className={axeFontColor}
            />
          </div>

          {/** Titre */}
          <AxeTitleInput fontColor={axeFontColor} />
        </button>

        {/** Boutons d'édition (au survol ou si la barre de titre a le focus) */}
        {!isReadOnly && (
          <>
            <div className="invisible group-hover/heading:visible group-focus-within/title:visible flex self-center gap-3 ml-3 min-w-max">
              {planOptions.isOptionEnabled(PlanDisplayOptionsEnum.ACTIONS) ? (
                <Button
                  variant="grey"
                  size="xs"
                  onClick={() => {
                    setIsOpen(true);
                    createFicheResume.mutateAsync();
                  }}
                >
                  Créer une action
                </Button>
              ) : (
                <Tooltip label="Les actions sont masquées dans l’affichage global">
                  <Button disabled variant="grey" size="xs">
                    Créer une action
                  </Button>
                </Tooltip>
              )}
              <AxeMenuButton />
            </div>
            <AxeIndicateursPanel />
          </>
        )}
      </div>
    </div>
  );
};
