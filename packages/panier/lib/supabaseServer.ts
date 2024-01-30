import {Database} from '@tet/api';
import {createServerComponentClient} from '@supabase/auth-helpers-nextjs';
import {cookies} from 'next/headers';

export const supabase = createServerComponentClient<Database>(
  {cookies}, {
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    options: {
      db: {
        schema: 'public',
      },
    },
  },
);
