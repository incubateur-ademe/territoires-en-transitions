export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return (error as any).message || 'Unknown error';
};

export const getErrorWithCode = function (error: unknown): {
  message: string;
  code?: string;
} {
  const errorWithCode: {
    message: string;
    code?: string;
  } = {
    message: getErrorMessage(error),
  };
  if ((error as any).code) {
    errorWithCode.code = (error as any).code;
  }
  return errorWithCode;
};
