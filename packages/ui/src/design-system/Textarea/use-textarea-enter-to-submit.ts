export const useTextareaEnterToSubmit = (onSubmit?: () => void) => {
  const handleEnterToSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return { handleEnterToSubmit };
};
