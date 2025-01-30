import { useEffect, useRef, useState } from 'react';

export const useSticky = () => {
  const ref = useRef(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([event]) => setIsSticky(event.intersectionRatio < 1),
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return { ref, isSticky };
};
