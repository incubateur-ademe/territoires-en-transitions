const Title = ({ children }: { children: React.ReactNode }) => (
  <h6 className="text-lg leading-4 text-primary-10 font-bold mb-6">
    {children}
  </h6>
);

export const FormSection = ({
  title = '',
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-[10px] bg-white p-8 w-full">
    {title && <Title>{title}</Title>}
    <form className="flex flex-col gap-4">{children}</form>
  </div>
);
