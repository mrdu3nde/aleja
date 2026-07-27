"use client";

import { Search } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--admin-placeholder)" }} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // a studio search box should never offer the owner's own saved details
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-lpignore="true"
        data-1p-ignore=""
        data-form-type="other"
        className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:ring-1 focus:ring-[#6B4E3D]"
        style={{
          border: "1px solid var(--admin-input-border)",
          backgroundColor: "var(--admin-input)",
          color: "var(--admin-text)",
        }}
      />
    </div>
  );
}
