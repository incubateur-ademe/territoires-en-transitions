'use client'
import * as amplitude from '@amplitude/analytics-browser';
import {useEffect} from "react";


export function Amplitude() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_AMPLITUDE_KEY;
    console.log('amplitude', key)
    if (window.location && key && key.length == 32)
      amplitude.init(key, {
        defaultTracking: true,
        serverZone: 'EU',
      });
  }, []);

  return null;
}
