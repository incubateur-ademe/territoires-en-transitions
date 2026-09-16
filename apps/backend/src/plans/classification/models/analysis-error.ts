export type AnalysisError =
  | { kind: 'job_unreadable'; jobId: string; cause: string }
  | { kind: 'transition_failed'; jobId: string; cause: string }
  | { kind: 'interrupted'; jobId: string; message: string };

export const toAnalysisErrorMessage = (error: AnalysisError): string => {
  switch (error.kind) {
    case 'job_unreadable':
      return `Job ${error.jobId} illisible (${error.cause})`;
    case 'transition_failed':
      return `Transition du job ${error.jobId} impossible (${error.cause})`;
    case 'interrupted':
      return error.message;
  }
};
