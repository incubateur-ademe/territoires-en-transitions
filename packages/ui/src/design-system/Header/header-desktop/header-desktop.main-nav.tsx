import { cn } from '../../../utils/cn';
import { HeaderProps } from '../Header';
import { HeaderDesktopMainNavItem } from './header-desktop.main-nav-item';

export const HEADER_MAIN_NAV_ID = 'header-main-nav';

type Props = Pick<HeaderProps, 'pathname'> & {
  mainNav: NonNullable<HeaderProps['mainNav']>;
  className?: string;
};

/**
 * Rangée de navigation principale du header desktop. Exportée seule pour
 * pouvoir être rendue hors du header, quand l'app l'encadre avec le contenu
 * (cf. `isMainNavDetached`).
 */
export const HeaderMainNav = ({ pathname, mainNav, className }: Props) => (
  <div
    id={HEADER_MAIN_NAV_ID}
    className={cn(
      'w-full max-w-8xl mx-auto px-6 flex items-center text-sm text-primary-9',
      className
    )}
  >
    {/* Les items portent un `p-4` qui les décollerait de la gouttière du
        conteneur : le premier est ramené dessus, pour que la navigation
        tombe sur la même verticale que le logo, le titre de page et les
        bandeaux. Le dernier item de droite est traité de même. */}
    {mainNav.startItems.map((item, i) => (
      <HeaderDesktopMainNavItem
        key={i}
        item={{
          ...item,
          className: cn(i === 0 && '-ml-4', item.className),
        }}
        pathname={pathname}
      />
    ))}
    {mainNav.endItems && (
      <div className="ml-auto flex items-center -mr-4">
        {mainNav.endItems.map((item, i) => (
          <HeaderDesktopMainNavItem key={i} item={item} pathname={pathname} />
        ))}
      </div>
    )}
  </div>
);
