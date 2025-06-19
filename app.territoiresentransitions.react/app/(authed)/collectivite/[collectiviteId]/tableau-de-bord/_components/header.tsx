import { useCurrentCollectivite } from '@/api/collectivites';
import { TDBViewId } from '@/app/app/paths';
import { Button, ButtonProps } from '@/ui';
import { TabsTab } from '@/ui/design-system/Tabs/Tabs.next';

type Props = {
  activeTab: TDBViewId;
  title: string;
  subtitle?: string;
  pageButtons?: ButtonProps[];
};

const Header = ({ activeTab, title, subtitle, pageButtons }: Props) => {
  const { isReadOnly } = useCurrentCollectivite();
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
      {!isReadOnly && (
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
