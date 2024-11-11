import classNames from 'classnames';
import { useFonctionTracker } from 'core-logic/hooks/useFonctionTracker';
import SideNav, { SideNavLinks } from './SideNav';

export type SideNavContainerProps = {
  links: SideNavLinks;
  isHideable?: boolean;
  /** pour afficher du HTML sous la navigation, le plus souvent des bouttons */
  actions?: React.ReactNode;
};

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  sideNav: SideNavContainerProps;
};

const SideNavContainer = ({ isOpen, setIsOpen, sideNav }: Props) => {
  const { links, isHideable = true, actions } = sideNav;
  const tracker = useFonctionTracker();

  return (
    <div className="sticky top-0 h-screen overflow-y-auto">
      {isOpen ? (
        <div
          className={classNames(
            'flex flex-col shrink-0 min-h-full py-8 border-r border-gray-100',
            { 'pt-4 pb-8': isHideable }
          )}
        >
          {isHideable && (
            <button
              className="ml-auto mr-4 mb-4 fr-btn fr-btn--tertiary fr-btn--icon fr-btn--sm fr-fi-arrow-left-s-line-double"
              onClick={() => {
                setIsOpen(false);
                tracker({
                  fonction: 'navigation_laterale',
                  action: 'fermeture',
                });
              }}
            />
          )}
          <SideNav links={links} />
          <div className={classNames('mb-8', { 'pt-8': links.length > 0 })}>
            {actions}
          </div>
        </div>
      ) : (
        <button
          className="mt-4 mx-auto fr-btn fr-btn--tertiary fr-btn--icon fr-btn--sm fr-fi-arrow-right-s-line-double"
          onClick={() => {
            setIsOpen(true);
            tracker({ fonction: 'navigation_laterale', action: 'ouverture' });
          }}
        />
      )}
    </div>
  );
};

export default SideNavContainer;
