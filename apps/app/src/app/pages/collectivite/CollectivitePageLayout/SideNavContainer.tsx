import { Button, Event, useEventTracker } from '@/ui';
import classNames from 'classnames';
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
  const tracker = useEventTracker();

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
            <Button
              className="ml-auto mr-4 mb-4"
              variant="grey"
              size="xs"
              icon="arrow-left-double-line"
              onClick={() => {
                setIsOpen(false);
                tracker(Event.toggleNavigationLaterale, {
                  action: 'fermeture',
                });
              }}
            />
          )}
          {actions}
          <SideNav links={links} />
        </div>
      ) : (
        <Button
          className="mt-4 mx-auto"
          variant="grey"
          size="xs"
          icon="arrow-right-double-line"
          onClick={() => {
            setIsOpen(true);
            tracker(Event.toggleNavigationLaterale, {
              action: 'ouverture',
            });
          }}
        />
      )}
    </div>
  );
};

export default SideNavContainer;
