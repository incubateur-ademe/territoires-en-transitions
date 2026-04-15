'use client';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export function ScrollReset() {
  const { actionId } = useParams<{ actionId?: string }>();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [actionId]);

  return null;
}
