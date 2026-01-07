export const ContentPanelWithHeader = ({
  children,
  headerActionButtonsLeft,
  headerActionButtonsRight,
}: {
  children: React.ReactNode;
  headerActionButtonsLeft: React.ReactNode;
  headerActionButtonsRight: React.ReactNode;
}) => {
  return (
    <div className="bg-white rounded-md p-4 min-h-[30vh]">
      <div className="flex items-center justify-between">
        <div className="flex items-center align-middle gap-4">
          {headerActionButtonsLeft}
        </div>
        <div className="flex items-center align-middle gap-4">
          {headerActionButtonsRight}
        </div>
      </div>
      {children}
    </div>
  );
};
