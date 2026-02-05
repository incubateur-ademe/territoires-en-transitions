import { TDBViewId } from '@/app/app/paths';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, ButtonProps } from '@tet/ui';
import { TabsTab } from '@tet/ui/design-system/TabsNext/index';

type Props = {
  activeTab: TDBViewId;
  pageButtons?: ButtonProps[];
};

const Header = ({ activeTab, pageButtons }: Props) => {
  const { prenom } = useUser();
  const { isSimplifiedView, collectiviteNom } = useCurrentCollectivite();
  const isVisitor = useIsVisitor();

  const isTdbTabsVisible = !isVisitor && !isSimplifiedView;

  const title = isVisitor
    ? `Tableau de bord de la collectivité ${collectiviteNom}`
    : `Bonjour ${prenom}`;

  const subtitle = isVisitor
    ? undefined
    : 'Bienvenue sur Territoires en Transitions';

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-start max-sm:flex-col gap-4 pb-4 border-b border-primary-3">
        <div className="flex flex-col gap-4">
          <h2 className="mb-0 text-primary-9">{title}</h2>
          {subtitle && <p className="mb-0 text-2xl text-grey-8">{subtitle}</p>}
        </div>
        {pageButtons && (
          <div className="flex flex-wrap gap-3">
            {pageButtons.map((buttonProps, index) => (
              <Button key={index} {...buttonProps} />
            ))}
          </div>
        )}
      </div>
      {/** Tabs */}
      {isTdbTabsVisible && (
        <div className="flex flex-wrap gap-3 py-4 border-b border-primary-3 !list-none">
          <TabsTab
            label="Tableau de bord"
            href="synthetique"
            isActive={activeTab === 'synthetique'}
          />
          <TabsTab
            label="Mon suivi personnel"
            href="personnel"
            isActive={activeTab === 'personnel'}
          />
        </div>
      )}
    </div>
  );
};

export default Header;
