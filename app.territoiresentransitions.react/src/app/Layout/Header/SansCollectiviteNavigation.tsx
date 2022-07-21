import {AssocierCollectiviteDialog} from 'ui/collectivites/AssocierCollectiviteDialog';
import {getReferentContacts} from 'core-logic/api/procedures/collectiviteProcedures';

const CollectiviteNavigation = () => {
  return (
    <div className="fr-container hidden lg:block">
      <div className="flex flex-row justify-between">
        <nav
          className="flex flex-row w-full text-sm"
          aria-label="Menu principal"
        >
          <div className="py-4">
            <AssocierCollectiviteDialog
              getReferentContacts={getReferentContacts}
            />
          </div>
        </nav>
      </div>
    </div>
  );
};

export default CollectiviteNavigation;
