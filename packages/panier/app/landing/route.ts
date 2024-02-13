import { cookies } from "next/headers";
import { createClient } from "src/supabase/server";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  const supabase = createClient(cookies());
  const { error, data } = await supabase.rpc("panier_from_landing");

  if (data) {
    const params = request.nextUrl.searchParams.size
      ? `?${request.nextUrl.searchParams}`
      : "";
    redirect(`/panier/${data.id}${params}`);
  }

  throw error;
};
