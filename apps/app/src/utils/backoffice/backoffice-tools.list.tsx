import { Icon } from '@tet/ui';
import Link from 'next/link';
import { BackofficeTool } from './backoffice-tools';

export const BackofficeToolsList = ({ tools }: { tools: BackofficeTool[] }) => (
  <div className="flex flex-col border border-grey-3 rounded-lg bg-white overflow-hidden">
    {tools.map((tool) => (
      <Link
        key={tool.id}
        data-test={`backoffice.tools.${tool.id}`}
        href={tool.href}
        className="flex items-center gap-4 py-4 px-4 md:px-6 border-t border-grey-3 first:border-t-0 bg-none after:hidden hover:bg-primary-1 transition"
      >
        <Icon icon={tool.icon} size="md" className="text-primary-9 shrink-0" />
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="basis-[280px] shrink text-base leading-6 font-bold text-primary-9">
            {tool.label}
          </span>
          <p className="flex-[1_1_320px] mb-0 text-sm leading-[22px] text-grey-8">
            {tool.description}
          </p>
        </div>
        <Icon
          icon="arrow-right-s-line"
          size="md"
          className="text-primary-8 shrink-0"
        />
      </Link>
    ))}
  </div>
);
