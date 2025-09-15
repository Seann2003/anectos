"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DateTimePickerProps = {
  label?: string;
  value?: Date | null;
  onChange: (d: Date | null) => void;
};

export function DateTimePicker({
  label,
  value,
  onChange,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const timeStr = useMemo(() => {
    if (!value) return "";
    const hh = String(value.getHours()).padStart(2, "0");
    const mm = String(value.getMinutes()).padStart(2, "0");
    const ss = String(value.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }, [value]);

  const setDatePart = (d: Date | undefined) => {
    if (!d) {
      onChange(null);
      return;
    }
    if (!value) {
      onChange(d);
      return;
    }
    const merged = new Date(d);
    merged.setHours(
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      0
    );
    onChange(merged);
  };

  const setTimePart = (t: string) => {
    if (!t) return;
    const [h, m, s] = t.split(":").map((x) => parseInt(x, 10));
    const base = value ? new Date(value) : new Date();
    base.setHours(h || 0, m || 0, s || 0, 0);
    onChange(base);
  };

  return (
    <div className="flex gap-4 items-end">
      <div className="flex flex-col gap-2">
        {label && (
          <Label htmlFor="date-picker" className="px-1">
            {label}
          </Label>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-40 justify-between font-normal"
            >
              {value ? value.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={value ?? undefined}
              captionLayout="dropdown"
              onSelect={(d) => {
                setDatePart(d ?? undefined);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="time-picker" className="px-1">
          Time
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={timeStr}
          onChange={(e) => setTimePart(e.target.value)}
          placeholder="hh:mm:ss"
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
