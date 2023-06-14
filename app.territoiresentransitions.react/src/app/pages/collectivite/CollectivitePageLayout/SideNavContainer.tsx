import SideNav, {SideNavLinks} from 'ui/shared/SideNav';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  sideNavLinks: SideNavLinks;
};

const SideNavContainer = ({isOpen, setIsOpen, sideNavLinks}: Props) => {
  return (
    <div className="sticky top-0 h-screen overflow-y-auto">
      {isOpen ? (
        <div className="flex flex-col shrink-0 min-h-full pt-4 pb-8 border-r border-gray-100">
          <button
            className="ml-auto mr-4 mb-4 fr-btn fr-btn--tertiary fr-btn--icon fr-btn--sm fr-fi-arrow-left-s-line-double"
            onClick={() => setIsOpen(false)}
          />
          <SideNav links={sideNavLinks} />
        </div>
      ) : (
        <button
          className="mt-4 mx-auto fr-btn fr-btn--tertiary fr-btn--icon fr-btn--sm fr-fi-arrow-right-s-line-double"
          onClick={() => setIsOpen(true)}
        />
      )}
    </div>
  );
};

export default SideNavContainer;
