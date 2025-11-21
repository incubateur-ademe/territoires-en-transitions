import { format } from 'date-fns';

export const formatDate = (dateStr: Date | string | null | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : format(new Date(dateStr), 'dd/MM/yyyy');
};
