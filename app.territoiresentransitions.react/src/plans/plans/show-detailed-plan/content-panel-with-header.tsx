export const ContentPanelWithHeader = ({
  children,
  headerActionButtons,
  title,
}: {
  children: React.ReactNode;

  title: string;
  headerActionButtons: React.ReactNode;
}) => {
  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg text-primary-9 font-bold">{title} </div>
        <div className="flex items-center align-middle gap-4">
          {headerActionButtons}
        </div>
      </div>
      {children}
    </div>
  );
};
