export type AlertState = 'info' | 'error' | 'success' | 'warning';

export const stateToIcon: Record<AlertState, string> = {
  info: 'information-fill',
  error: 'spam-fill',
  success: 'checkbox-circle-fill',
  warning: 'information-fill',
};

export const alertClassnames: Record<
  AlertState,
  {
    text: string;
    background: string;
    border: string;
  }
> = {
  info: {
    text: 'text-info-1',
    background: 'bg-info-2',
    border: 'border-[0.5px] border-info-3',
  },
  error: {
    text: 'text-error-1',
    background: 'bg-error-2',
    border: 'border-[0.5px] border-error-3',
  },
  success: {
    text: 'text-success-1',
    background: 'bg-success-2',
    border: 'border-[0.5px] border-success-3',
  },
  warning: {
    text: 'text-warning-1',
    background: 'bg-warning-2',
    border: 'border-[0.5px] border-warning-3',
  },
};
