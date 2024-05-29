import retry, {Options} from 'async-retry';
import {supabase} from './supabase';

async function _testReset(): Promise<void> {
  const {status, error} = await supabase.rpc('test_reset');

  if (error) {
    console.error(error);
    throw `La RPC 'test_reset' devrait renvoyer un code 20x. (${status})`;
  }
}

export const testReset = () =>
  retry(_testReset, {
    retries: 5,
  } as Options);
