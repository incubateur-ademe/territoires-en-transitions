'use client'
import * as amplitude from '@amplitude/analytics-browser';
import {useEffect} from "react";

const key = process.env.NEXT_PUBLIC_AMPLITUDE_KEY;


export function Amplitude() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin && key && key.length == 32) {
      amplitude.init(key, {
        defaultTracking: true,
        serverZone: 'EU',
        serverUrl: `${window.location.origin}/api/amplitude`
      });
    }
  }, []);

  return null;
}
