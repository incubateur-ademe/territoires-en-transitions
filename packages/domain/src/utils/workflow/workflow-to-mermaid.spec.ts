import { describe, expect, it } from 'vitest';
import { createWorkflow } from './create-workflow';
import { workflowToMermaid } from './workflow-to-mermaid';

const workflow = createWorkflow({
  initialStatus: 'draft',
  transitions: {
    submit: { from: ['draft'], to: 'submitted' },
    approve: {
      from: ['submitted'],
      to: 'approved',
      guards: ['isOwner', 'isComplete'],
    },
    reopen: {
      from: ['submitted', 'approved'],
      to: 'draft',
      guards: ['isOwner'],
    },
  },
});

describe('workflowToMermaid', () => {
  it('renders statuses and guarded transitions', () => {
    expect(workflowToMermaid(workflow)).toBe(
      [
        'stateDiagram-v2',
        '  [*] --> draft',
        '  draft --> submitted : submit',
        '  submitted --> approved : approve [isOwner, isComplete]',
        // Une transition qui part de plusieurs statuts donne une flèche par statut.
        '  submitted --> draft : reopen [isOwner]',
        '  approved --> draft : reopen [isOwner]',
      ].join('\n')
    );
  });

  it('renders a single-transition workflow', () => {
    const minimal = createWorkflow({
      initialStatus: 'open',
      transitions: { close: { from: ['open'], to: 'closed' } },
    });

    expect(workflowToMermaid(minimal)).toBe(
      ['stateDiagram-v2', '  [*] --> open', '  open --> closed : close'].join(
        '\n'
      )
    );
  });
});
