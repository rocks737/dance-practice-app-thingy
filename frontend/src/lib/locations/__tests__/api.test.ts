import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fetchLocationsServer } from "../api";

function createThenableResponse(response: any) {
  return {
    then: (resolve: any) => resolve(response),
  };
}

describe("locations/api", () => {
  let mockSupabase: any;
  let table: any;
  let builder: any;

  beforeEach(() => {
    table = {
      select: jest.fn(),
    };

    builder = {
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
    };

    mockSupabase = {
      from: jest.fn().mockReturnValue(table),
    };

    table.select.mockReturnValue(builder);
  });

  it("fetches locations with pagination and returns data", async () => {
    const data = [
      {
        id: "loc-1",
        name: "Studio A",
        city: "Austin",
        state: "TX",
        country: "USA",
        location_type: 1,
        description: "Nice studio",
      },
    ];
    const count = 1;
    (builder as any).then = (resolve: any) => resolve({ data, count, error: null });

    const result = await fetchLocationsServer(mockSupabase, { page: 1, pageSize: 20 });

    expect(mockSupabase.from).toHaveBeenCalledWith("locations");
    expect(table.select).toHaveBeenCalledWith(
      "id,name,city,state,country,location_type,description",
      { count: "exact" },
    );
    expect(builder.order).toHaveBeenCalledWith("name", { ascending: true });
    expect(builder.range).toHaveBeenCalledWith(0, 19);
    expect(result.count).toBe(1);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0].name).toBe("Studio A");
  });

  it("applies 'q' filter with ilike against name and city", async () => {
    (builder as any).then = (resolve: any) =>
      resolve({ data: [], count: 0, error: null });

    await fetchLocationsServer(mockSupabase, { q: "downtown", page: 2, pageSize: 10 });

    // range for page 2, size 10 -> from=10,to=19
    expect(builder.range).toHaveBeenCalledWith(10, 19);
    expect(builder.or).toHaveBeenCalledWith(
      "name.ilike.%downtown%,city.ilike.%downtown%",
    );
  });

  it("throws on error", async () => {
    (builder as any).then = (resolve: any) =>
      resolve({ data: null, count: 0, error: { message: "boom" } });
    await expect(fetchLocationsServer(mockSupabase, {} as any)).rejects.toThrow("boom");
  });
});
