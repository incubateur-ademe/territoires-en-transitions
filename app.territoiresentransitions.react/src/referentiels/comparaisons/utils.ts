export const sortByDate = (dateA: string, dateB: string, ascending = true) => {
  const timeA = new Date(dateA).getTime();
  const timeB = new Date(dateB).getTime();
  return ascending ? timeA - timeB : timeB - timeA;
};
