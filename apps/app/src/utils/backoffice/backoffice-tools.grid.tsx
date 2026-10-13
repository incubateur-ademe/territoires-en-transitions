import { appLabels } from '@/app/labels/catalog';
import { Card, Icon } from '@tet/ui';
import { BackofficeTool } from './backoffice-tools';

export const BackofficeToolsGrid = ({ tools }: { tools: BackofficeTool[] }) => (
  <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))]">
    {tools.map((tool) => (
      <Card
        key={tool.id}
        dataTest={`backoffice.tools.${tool.id}`}
        href={tool.href}
        footer={
          <span className="flex items-center gap-1">
            {appLabels.administrationOuvrirOutil}
            <Icon icon="arrow-right-line" size="sm" />
          </span>
        }
      >
        <div className="w-12 h-12 shrink-0 rounded-lg bg-primary-2 flex items-center justify-center">
          <Icon icon={tool.icon} size="lg" className="text-primary-9" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-lg leading-6 font-bold text-primary-9">
            {tool.label}
          </span>
          <p className="paragraphe-14 mb-0">{tool.description}</p>
        </div>
      </Card>
    ))}
  </div>
);
