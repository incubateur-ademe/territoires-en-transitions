export type IdentifiantActionProps = {
  identifiant: string;
};

export const IdentifiantAction = (props: IdentifiantActionProps) => {
  const { identifiant } = props;

  return (
    <span className="text-grey-8 text-sm font-medium">{`(${identifiant})`}</span>
  );
};
