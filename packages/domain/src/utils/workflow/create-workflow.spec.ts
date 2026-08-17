import { describe, expect, it } from 'vitest';
import { createWorkflow, listEnabledTransitions } from './create-workflow';

const workflow = createWorkflow({
  initialStatus: 'draft',
  transitions: {
    submit: { from: ['draft'], to: 'submitted' },
    approve: {
      from: ['submitted'],
      to: 'approved',
      guards: ['isOwner', 'isComplete'],
    },
  },
});

describe('createWorkflow', () => {
  it('exposes the initial status and the transition names', () => {
    expect(workflow.initialStatus).toBe('draft');
    expect(workflow.transitionNames).toEqual(['submit', 'approve']);
  });

  it('checks structural transitions with can/getReachableTransitions', () => {
    expect(workflow.can('draft', 'submit')).toBe(true);
    expect(workflow.can('draft', 'approve')).toBe(false);
    expect(workflow.getReachableTransitions('submitted')).toEqual(['approve']);
    expect(workflow.getReachableTransitions('approved')).toEqual([]);
  });

  it('applies a transition and returns the target status', () => {
    expect(workflow.apply('draft', 'submit')).toEqual({
      success: true,
      data: { toStatus: 'submitted' },
    });
  });

  it('refuses a transition from a wrong status', () => {
    expect(workflow.apply('approved', 'submit')).toEqual({
      success: false,
      error: 'TRANSITION_NOT_ALLOWED',
      blockedBy: [],
    });
  });

  it('fails closed when a guard is missing or false, passes when true', () => {
    expect(workflow.apply('submitted', 'approve')).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
      blockedBy: ['isOwner', 'isComplete'],
    });
    expect(
      workflow.apply('submitted', 'approve', {
        guardResults: { isOwner: true, isComplete: false },
      })
    ).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
      blockedBy: ['isComplete'],
    });
    expect(
      workflow.apply('submitted', 'approve', {
        guardResults: { isOwner: true, isComplete: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'approved' } });
  });
});

describe('getRequiredGuards', () => {
  it('lists the guards the current status actually depends on', () => {
    expect(workflow.getRequiredGuards('draft')).toEqual([]);
    expect(workflow.getRequiredGuards('submitted')).toEqual([
      'isOwner',
      'isComplete',
    ]);
    expect(workflow.getRequiredGuards('approved')).toEqual([]);
  });
});

describe('evaluate', () => {
  it('separates an unreachable transition from a blocked one', () => {
    expect(workflow.evaluate('submitted', { isOwner: true })).toEqual({
      submit: { reachable: false, enabled: false, blockedBy: [] },
      approve: {
        reachable: true,
        enabled: false,
        blockedBy: ['isComplete'],
      },
    });
  });

  it('reports blocking guards in their declaration order', () => {
    expect(workflow.evaluate('submitted').approve.blockedBy).toEqual([
      'isOwner',
      'isComplete',
    ]);
  });

  it('lists the transitions that are applicable right now', () => {
    expect(
      listEnabledTransitions(
        workflow.evaluate('submitted', { isOwner: true, isComplete: true })
      )
    ).toEqual(['approve']);
    expect(listEnabledTransitions(workflow.evaluate('submitted'))).toEqual([]);
  });
});
