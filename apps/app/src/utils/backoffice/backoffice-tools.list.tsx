import { LinkList, LinkListItem } from '@tet/ui';
import { BackofficeTool } from './backoffice-tools';

export const BackofficeToolsList = ({ tools }: { tools: BackofficeTool[] }) => (
  <LinkList>
    {tools.map((tool) => (
      <LinkListItem
        key={tool.id}
        dataTest={`backoffice.tools.${tool.id}`}
        href={tool.href}
        icon={tool.icon}
        title={tool.label}
        description={tool.description}
      />
    ))}
  </LinkList>
);
