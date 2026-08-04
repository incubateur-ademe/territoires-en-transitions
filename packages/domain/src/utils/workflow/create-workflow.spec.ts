import { describe, expect, it } from 'vitest';
import { createWorkflow } from './create-workflow';

const workflow = createWorkflow({
  initialStatus: 'draft',
  transitions: {
    submit: { from: ['draft'], to: 'submitted' },
    approve: {
      from: ['submitted'],
      to: 'approved',
      guards: ['isComplete'],
    },
  },
});

describe('createWorkflow', () => {
  it('exposes the initial status and the transition names', () => {
    expect(workflow.initialStatus).toBe('draft');
    expect(workflow.transitionNames).toEqual(['submit', 'approve']);
  });

  it('checks structural transitions with can/getEnabledTransitions', () => {
    expect(workflow.can('draft', 'submit')).toBe(true);
    expect(workflow.can('draft', 'approve')).toBe(false);
    expect(workflow.getEnabledTransitions('submitted')).toEqual(['approve']);
    expect(workflow.getEnabledTransitions('approved')).toEqual([]);
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
    });
  });

  it('fails closed when a guard is missing or false, passes when true', () => {
    expect(workflow.apply('submitted', 'approve')).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
    });
    expect(
      workflow.apply('submitted', 'approve', {
        guardResults: { isComplete: false },
      })
    ).toEqual({ success: false, error: 'GUARD_NOT_SATISFIED' });
    expect(
      workflow.apply('submitted', 'approve', {
        guardResults: { isComplete: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'approved' } });
  });
});
