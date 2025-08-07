import { useEffect, useState } from 'react';

const screenIsMobile = () =>
  window.innerHeight <= 800 && window.innerWidth <= 600;

const NUMBER_ON_MOBILE = 5;
const NUMBER_ON_DESKTOP = 16;
export const useGetCardNumber = (): number => {
  const [cardNumber, setCardNumber] = useState(NUMBER_ON_MOBILE);
  useEffect(() => {
    setCardNumber(screenIsMobile() ? NUMBER_ON_MOBILE : NUMBER_ON_DESKTOP);
  }, []);
  return cardNumber;
};
