const toDateOnly = (date) => date.toISOString().slice(0, 10);

export const todayDateString = () => toDateOnly(new Date());

export const addDaysDateString = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
};

export const yesterdayDateString = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return toDateOnly(date);
};
