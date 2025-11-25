import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface LocationsQuery {
  q?: string;
  page?: number;
  pageSize?: number;
  type?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface LocationsResult {
  locations: Array<{
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    country: string | null;
    location_type: number | null;
    description: string | null;
  }>;
  count: number;
  page: number;
  pageSize: number;
}

export async function fetchLocationsServer(
  supabase: SupabaseClient<Database>,
  params: LocationsQuery,
): Promise<LocationsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 20);
  const q = (params.q ?? "").trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("locations")
    .select("id,name,city,state,country,location_type,description", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);

  if (q) {
    query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);
  }
  if (params.type && params.type !== "any") {
    const typeNum = Number(params.type);
    if (!Number.isNaN(typeNum)) {
      query = query.eq("location_type", typeNum);
    }
  }
  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }
  if (params.state) {
    query = query.ilike("state", `%${params.state}%`);
  }
  if (params.country) {
    query = query.ilike("country", `%${params.country}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return {
    locations: (data ?? []) as LocationsResult["locations"],
    count: count ?? 0,
    page,
    pageSize,
  };
}
