import { appLabels } from '@/app/labels/catalog';
import { Button, cn, Icon, Tooltip } from '@tet/ui';
import { PlanDisplayOptionsEnum } from '../plan-options.context';
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
    isOpenEditTitle,
    setIsOpenEditTitle,
    planOptions,
    providerProps,
  } = useAxeContext();
  const { axe } = providerProps;

  const axeFontColor = cn({
    'text-primary-8': isMainAxe,
    'text-grey-8': !isMainAxe,
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
        {isOpenEditTitle ? (
          <div className="flex grow">
            <AxeToggleIcon isOpen={isOpen} className={axeFontColor} />
            <AxeTitleInput fontColor={axeFontColor} />
          </div>
        ) : (
          <button
            type="button"
            className="flex grow hover:!bg-transparent active:!bg-transparent"
            onClick={(e) => {
              // shift-click passe le titre en mode édition
              if (e.shiftKey && !isReadOnly) {
                setIsOpenEditTitle(true);
              } else {
                setIsOpen(!isOpen);
              }
            }}
            onKeyDown={(e) => {
              if (e.shiftKey && e.code === 'Enter' && !isReadOnly) {
                e.preventDefault();
                setIsOpenEditTitle(true);
              }
            }}
            title={appLabels.cliquerPourOuvrirFermerLAxe}
          >
            <AxeToggleIcon isOpen={isOpen} className={axeFontColor} />
            <span
              className={cn(
                'grow self-center text-left text-lg font-bold leading-5',
                isMainAxe && 'text-primary-10',
                !isMainAxe && 'text-grey-7',
                !axe.nom && 'italic'
              )}
            >
              {axe.nom || appLabels.sansTitre}
            </span>
          </button>
        )}

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
                  {appLabels.creerAction}
                </Button>
              ) : (
                <Tooltip label={appLabels.actionsMasqueesDansAffichageGlobal}>
                  <Button disabled variant="grey" size="xs">
                    {appLabels.creerAction}
                  </Button>
                </Tooltip>
              )}
              <AxeMenuButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AxeToggleIcon = ({
  isOpen,
  className,
}: {
  isOpen: boolean;
  className: string;
}) => (
  <div className={cn('self-center mr-2', isOpen && 'rotate-90')}>
    <Icon icon="arrow-right-s-line" size="lg" className={className} />
  </div>
);
