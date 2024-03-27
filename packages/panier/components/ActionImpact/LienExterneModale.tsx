import {Icon} from '@tet/ui';

type LienExterneModaleProps = {
  url: string;
  label: string;
};

const LienExterneModale = ({url, label}: LienExterneModaleProps) => {
  return (
    <div className="flex items-center gap-2">
      <Icon icon="external-link-line" size="lg" className="text-primary-4" />
      <a
        href={url}
        className="text-primary-10 text-sm font-bold bg-none active:!bg-transparent after:hidden border-b border-primary-10 hover:border-b-2 p-px hover:pb-0"
        target="_blank"
        rel="noreferrer noopener"
      >
        {label}
      </a>
    </div>
  );
};

export default LienExterneModale;
