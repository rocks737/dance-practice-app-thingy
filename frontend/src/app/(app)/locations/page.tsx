import { createClient } from "@/lib/supabase/server";
import { MapPin, Search } from "lucide-react";
import { fetchLocationsServer } from "@/lib/locations/api";
import { AddToPreferencesButton } from "@/components/locations/AddToPreferencesButton";
import { fetchProfileIdByAuthUserId } from "@/lib/profiles/api";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { LocationEditorDialog } from "@/components/locations/LocationEditorDialog";

interface LocationsPageProps {
  searchParams?: {
    q?: string;
    page?: string;
    type?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const profileId = await fetchProfileIdByAuthUserId(supabase, user.id);
    if (profileId) {
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profileId);
      isAdmin = Boolean(roleRows?.some((r) => r.role === "ADMIN"));
    }
  }
  const q = (searchParams?.q || "").trim();
  const page = Number(searchParams?.page || "1");
  const type = (searchParams?.type || "any").toString();
  const city = (searchParams?.city || "").toString();
  const state = (searchParams?.state || "").toString();
  const country = (searchParams?.country || "").toString();
  const pageSize = 20;

  const { locations, count } = await fetchLocationsServer(supabase, {
    q,
    page,
    pageSize,
    type,
    city,
    state,
    country,
  });

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Explore practice locations. Search by name or city.
          </p>
        </div>
        {isAdmin && (
          <LocationEditorDialog
            trigger={
              <button className="inline-flex items-center rounded-md border px-3 py-2 text-xs sm:text-sm font-medium hover:bg-accent hover:text-accent-foreground flex-shrink-0">
                New location
              </button>
            }
            mode="create"
          />
        )}
      </div>

      <form
        className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-2 md:grid-cols-5"
        action="/locations"
        method="get"
      >
        <div className="relative md:col-span-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or city..."
            className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm"
          />
        </div>
        <div>
          <select
            name="type"
            defaultValue={type || "any"}
            className="w-full rounded-md border bg-background px-2 py-2 text-sm"
            aria-label="Location type"
          >
            <option value="any">Any type</option>
            <option value="1">Studio</option>
            <option value="2">Home</option>
            <option value="3">Venue</option>
            <option value="4">Outdoor</option>
            <option value="0">Other</option>
          </select>
        </div>
        <div>
          <input
            type="text"
            name="state"
            defaultValue={state}
            placeholder="State/Province"
            className="w-full rounded-md border bg-background px-2 py-2 text-sm"
          />
        </div>
        <div>
          <input
            type="text"
            name="country"
            defaultValue={country}
            placeholder="Country"
            className="w-full rounded-md border bg-background px-2 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-5 flex items-center justify-end gap-2">
          <button
            type="submit"
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Apply
          </button>
          <a
            href="/locations"
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Reset
          </a>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(locations ?? []).map((loc) => (
          <div
            key={loc.id}
            className="rounded-lg border bg-card p-4 shadow-sm flex h-full flex-col"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{loc.name}</h3>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {loc.city ? `${loc.city}, ` : ""}
                    {loc.state ? `${loc.state}, ` : ""}
                    {loc.country}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border px-2 py-0.5 text-xs">
                  {locationTypeLabel(loc.location_type)}
                </span>
                {isAdmin && (
                  <LocationEditorDialog
                    trigger={
                      <button
                        title="Edit location"
                        className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    }
                    mode="edit"
                    location={{
                      id: loc.id,
                      name: loc.name,
                      city: loc.city,
                      state: loc.state,
                      country: loc.country,
                      description: loc.description,
                      location_type: loc.location_type,
                    }}
                  />
                )}
              </div>
            </div>
            {loc.description && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                {loc.description}
              </p>
            )}
            <div className="mt-auto pt-4">
              <AddToPreferencesButton locationId={loc.id} />
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <a
            href={`/locations?${new URLSearchParams({ q, page: String(Math.max(1, page - 1)) }).toString()}`}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-disabled={page <= 1}
          >
            Previous
          </a>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <a
            href={`/locations?${new URLSearchParams({ q, page: String(Math.min(totalPages, page + 1)) }).toString()}`}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-disabled={page >= totalPages}
          >
            Next
          </a>
        </div>
      )}
    </div>
  );
}

function locationTypeLabel(value: number | null): string {
  // Keep basic mapping (adjust as your enum mapping requires)
  switch (value) {
    case 0:
      return "Other";
    case 1:
      return "Studio";
    case 2:
      return "Home";
    case 3:
      return "Venue";
    case 4:
      return "Outdoor";
    default:
      return "Location";
  }
}
