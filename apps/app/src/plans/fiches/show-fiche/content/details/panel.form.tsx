import { Spacer } from '@tet/ui';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h6 className="text-base leading-4 text-primary-10 font-bold mb-0">
    {children}
  </h6>
);

export const PanelForm = ({
  title = '',
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-[10px] bg-white border border-grey-3 p-8 w-full">
    {title && (
      <>
        <Title>{title}</Title>
        <Spacer height={2} />
      </>
    )}
    <form className="flex flex-col gap-4">{children}</form>
  </div>
);
