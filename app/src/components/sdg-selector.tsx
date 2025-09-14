"use client";

import { useMemo, useState } from "react";
import { SDG_GOALS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search } from "lucide-react";

export type SdgSelectorProps = {
  selected: number[];
  onChange: (next: number[]) => void;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  showSelected?: boolean;
};

export function SdgSelector({
  selected,
  onChange,
  className,
  side = "right",
  align = "start",
  sideOffset = 8,
  showSelected = true,
}: SdgSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SDG_GOALS;
    return SDG_GOALS.filter(
      (g) => g.label.toLowerCase().includes(q) || String(g.id).includes(q)
    );
  }, [query]);

  const toggle = (id: number) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  };

  const selectAll = () => onChange(SDG_GOALS.map((g) => g.id));
  const clearAll = () => onChange([]);

  return (
    <div className={className}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
          >
            {selected.length > 0
              ? `SDGs (${selected.length} selected)`
              : "Select SDGs"}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-80 p-0 bg-white"
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          {/* Header */}
          <div className="px-3 pt-3 pb-2 border-b">
            <div className="text-sm font-medium">Select applicable goals</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or #"
                  className="w-full pl-8 pr-2 py-2 text-sm rounded-md border"
                />
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-blue-700 hover:underline"
              >
                Select all
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="max-h-64 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
            ) : (
              filtered.map((g) => (
                <DropdownMenuCheckboxItem
                  key={g.id}
                  checked={selected.includes(g.id)}
                  onCheckedChange={() => toggle(g.id)}
                  className="text-sm"
                >
                  <span className="font-mono mr-1">{g.id}.</span> {g.label}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t flex items-center justify-between text-xs text-gray-600">
            <span>{selected.length} selected</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded-md border hover:bg-gray-50"
                size="sm"
              >
                Apply
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {selected.length > 0 && showSelected && (
        <div className="mt-2 text-sm text-gray-700">
          Selected:{" "}
          {selected
            .slice()
            .sort((a, b) => a - b)
            .join(", ")}
        </div>
      )}
    </div>
  );
}

export default SdgSelector;
