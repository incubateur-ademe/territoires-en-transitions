import { TDBViewId } from '@/app/app/paths';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, ButtonProps, PageHeader } from '@tet/ui';
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
    <>
      <PageHeader>
        <PageHeader.Title>{title}</PageHeader.Title>
        {pageButtons && (
          <PageHeader.Actions>
            <div className="flex flex-wrap gap-3">
              {pageButtons.map((buttonProps, index) => (
                <Button key={index} {...buttonProps} />
              ))}
            </div>
          </PageHeader.Actions>
        )}
        {subtitle && (
          <PageHeader.Subtitle>
            <p className="mb-0 text-2xl text-grey-8">{subtitle}</p>
          </PageHeader.Subtitle>
        )}
      </PageHeader>
      {isTdbTabsVisible && (
        <div className="flex flex-wrap gap-3 pb-4 border-b border-primary-3 !list-none">
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
    </>
  );
};

export default Header;
