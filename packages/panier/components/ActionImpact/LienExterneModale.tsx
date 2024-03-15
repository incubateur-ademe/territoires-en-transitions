import Markdown from '@components/Markdown';
import {Icon} from '@tet/ui';

type LienExterneModaleProps = {
  markdownLink?: string;
  href?: string;
  label?: string;
};

const LienExterneModale = ({
  markdownLink,
  href,
  label,
}: LienExterneModaleProps) => {
  return !!markdownLink || (!!href && !!label) ? (
    <div className="flex items-center gap-2">
      <Icon icon="external-link-line" size="lg" className="text-primary-4" />
      {!!markdownLink ? (
        <Markdown content={markdownLink} />
      ) : (
        !!href &&
        !!label && (
          <a
            href={href}
            className="text-primary-10 text-sm font-bold bg-none active:!bg-transparent after:hidden border-b border-primary-10 hover:border-b-2 p-px hover:pb-0"
            target="_blank"
            rel="noreferrer noopener"
          >
            {label}
          </a>
        )
      )}
    </div>
  ) : null;
};

export default LienExterneModale;
