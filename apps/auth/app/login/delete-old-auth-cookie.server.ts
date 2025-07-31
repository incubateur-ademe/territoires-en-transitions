'use server';

import { cookies } from 'next/headers';

export async function deleteOldAuthCookie() {
  const cookieStore = await cookies();

  cookieStore
    .getAll()
    .filter(({ name }) => name.startsWith('sb-'))
    .forEach(({ name }) => {
      console.log('deleting cookie', name);
      // I don't kwnow why but this actually delete only cookie on subdomain
      // e.g auth.territoiresentransitions.fr
      // which is exactly what we want.
      // When the cookie is set on the root domain, it is not deleted.
      cookieStore.delete(name);
    });
}
