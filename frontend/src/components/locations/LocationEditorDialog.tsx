"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface LocationEditorDialogProps {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  location?: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    country: string | null;
    description: string | null;
    location_type: number | null;
  };
}

export function LocationEditorDialog({
  trigger,
  mode,
  location,
}: LocationEditorDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: location?.name ?? "",
    city: location?.city ?? "",
    state: location?.state ?? "",
    country: location?.country ?? "",
    description: location?.description ?? "",
    location_type: String(location?.location_type ?? "1"),
  });

  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const payload = {
        name: form.name.trim(),
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || null,
        description: form.description.trim() || null,
        location_type: Number(form.location_type),
      };
      if (mode === "create") {
        const { error } = await supabase.from("locations").insert(payload);
        if (error) throw error;
        toast.success("Location created");
      } else {
        const { error } = await supabase
          .from("locations")
          .update(payload)
          .eq("id", location!.id);
        if (error) throw error;
        toast.success("Location updated");
      }
      onClose();
      router.refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save location");
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    if (!location?.id) return;
    if (!confirm("Delete this location? This cannot be undone.")) return;
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("locations").delete().eq("id", location.id);
      if (error) throw error;
      toast.success("Location deleted");
      onClose();
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete location");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="inline-block">
      <span onClick={onOpen} className="cursor-pointer">
        {trigger}
      </span>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-lg rounded-lg bg-background p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {mode === "create" ? "Create location" : "Edit location"}
              </h3>
              <button onClick={onClose} className="text-sm hover:underline">
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location_type">Type</Label>
                <select
                  id="location_type"
                  name="location_type"
                  value={form.location_type}
                  onChange={handleChange}
                  className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                >
                  <option value="1">Studio</option>
                  <option value="2">Home</option>
                  <option value="3">Venue</option>
                  <option value="4">Outdoor</option>
                  <option value="0">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              {mode === "edit" ? (
                <Button variant="destructive" onClick={handleDelete} disabled={pending}>
                  Delete
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose} disabled={pending}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={pending}>
                  {pending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
