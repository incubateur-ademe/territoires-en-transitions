import {Database} from '@tet/api';
import {createClientComponentClient} from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient<Database>(
  {
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    options: {
      db: {
        schema: 'public',
      },
    },
  },
);
