// hooks/useCharLimit.ts
'use client'

import { useEffect, useState } from 'react'

export default function useCharLimit() {
  const [charLimit, setCharLimit] = useState(300);

  useEffect(() => {
    const updateCharLimit = () => {
      const width = window.innerWidth;
      if (width < 480) setCharLimit(150);
      else if (width < 768) setCharLimit(200);
      else if (width < 1024) setCharLimit(250);
      else setCharLimit(300);
    };

    updateCharLimit();
    window.addEventListener('resize', updateCharLimit);
    return () => window.removeEventListener('resize', updateCharLimit);
  }, []);

  return charLimit;
}
