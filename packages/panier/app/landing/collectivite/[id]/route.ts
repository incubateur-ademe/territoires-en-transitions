import { cookies } from "next/headers";
import { createClient } from "src/supabase/server";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } },
) => {
  const supabase = createClient(cookies());
  const collectivite_id = parseInt(params.id);
  const { error, data } = await supabase.rpc(
    "panier_from_landing",
    {
      collectivite_id,
    },
  );
  if (data) {
    const params = request.nextUrl.searchParams.size
      ? `?${request.nextUrl.searchParams}`
      : "";
    redirect(`/panier/${data.id}${params}`);
  }

  throw error;
};
