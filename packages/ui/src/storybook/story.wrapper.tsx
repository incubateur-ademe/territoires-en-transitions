type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export const StoryWrapper = ({ title, description, children }: Props) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-grey-8 mb-0">{description}</p>
      </div>
      {children}
    </div>
  );
};
