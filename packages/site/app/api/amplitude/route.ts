import {NextRequest, NextResponse} from 'next/server'

const key = process.env.NEXT_PUBLIC_AMPLITUDE_KEY;
const url = 'https://api.eu.amplitude.com/2/httpapi';

/**
 * Fait suivre les événements à Amplitude
 * Renvoi la réponse d'Amplitude en cas de succès.
 *
 * @param request La requête avec la payload Amplitude
 */
export async function POST(request: NextRequest) {
  if (key && key.length == 32) {
    const payload = await request.json();

    if (!payload["api_key"] || !payload["events"]) {
      return NextResponse.json({
        'error': 'Invalid payload',
      }, {status: 400});
    }

    if (payload["api_key"] !== key) {
      return NextResponse.json({
        'error': 'The payload key does not match the server key',
        'hint': 'check "NEXT_PUBLIC_AMPLITUDE_KEY"'
      }, {status: 400});
    }

    const amplitudeResponse = await fetch(
      url,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        cache: 'no-cache'
      }
    )

    return NextResponse.json(await amplitudeResponse.json(), {status: amplitudeResponse.status});
  } else {
    return NextResponse.json({
      'error': 'No valid amplitude key on server',
      'hint': 'check "NEXT_PUBLIC_AMPLITUDE_KEY"'
    }, {status: 500});
  }
}
