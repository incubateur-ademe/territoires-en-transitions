import {Icon} from '@tet/ui';

type LienExterneModaleProps = {
  url: string;
  label: string;
};

const LienExterneModale = ({url, label}: LienExterneModaleProps) => {
  return (
    <div className="flex items-start gap-2">
      <Icon icon="external-link-line" size="lg" className="text-primary-4" />
      <a
        href={url}
        className="text-primary-10 text-sm leading-6 font-bold hover:text-primary-8 bg-none active:!bg-transparent after:hidden underline underline-offset-4"
        target="_blank"
        rel="noreferrer noopener"
      >
        {label}
      </a>
    </div>
  );
};

export default LienExterneModale;
