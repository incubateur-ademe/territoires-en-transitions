const screenIsMobile = () =>
  window.innerHeight <= 800 && window.innerWidth <= 600;

export const NB_CARDS_PER_PAGE = screenIsMobile() ? 5 : 16;
