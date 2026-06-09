"use client";

import { useState } from "react";

export interface Column {
  key: string;
  label: string;
  hideOnMobile?: boolean;
  primary?: boolean;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Search...",
  emptyIcon = "search_off",
  emptyTitle = "Tidak ada data",
  emptyDescription = "Coba ubah filter atau kata kunci pencarian Anda.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  const filtered = data.filter((row) =>
    search === ""
      ? true
      : columns.some((col) =>
          String(row[col.key] ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  // Determine primary and secondary columns for mobile card view
  const primaryCol = columns.find((c) => c.primary) || columns[0];
  const visibleMobileCols = columns.filter(
    (c) => !c.hideOnMobile && c.key !== primaryCol.key,
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Search Bar */}
      {searchable && (
        <div className="px-2 md:px-4 py-2 md:py-3 border-b border-slate-100">
          <div className="relative max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg md:text-xl">
              search
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border-none text-xs md:text-sm focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-400"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Desktop Table View ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-3 md:px-4 py-2.5 md:py-3 text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr
                key={i}
                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 md:px-4 py-2.5 md:py-3 text-slate-700 text-xs md:text-sm"
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-slate-200">
                      {emptyIcon}
                    </span>
                    <p className="text-sm font-bold text-slate-500">
                      {emptyTitle}
                    </p>
                    <p className="text-xs text-slate-300">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card View ── */}
      <div className="md:hidden">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 px-6">
            <span className="material-symbols-outlined text-4xl text-slate-200">
              {emptyIcon}
            </span>
            <p className="text-sm font-bold text-slate-400">{emptyTitle}</p>
            <p className="text-xs text-slate-300 text-center">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((row, i) => (
              <div
                key={i}
                className="p-3.5 hover:bg-slate-50/50 transition-colors"
              >
                {/* Primary value (title) + Status */}
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="font-bold text-slate-800 text-sm flex-1 truncate">
                    {primaryCol.render
                      ? primaryCol.render(row[primaryCol.key], row)
                      : String(row[primaryCol.key] ?? "")}
                  </div>
                  {/* Show status badge if it exists */}
                  {columns.find((c) => c.key === "status") && (
                    <div className="flex-shrink-0">
                      {columns
                        .find((c) => c.key === "status")
                        ?.render?.(row["status"], row) ||
                        String(row["status"] ?? "")}
                    </div>
                  )}
                </div>
                {/* Secondary values as compact grid */}
                <div className="grid grid-cols-2 gap-2">
                  {visibleMobileCols
                    .filter((c) => c.key !== "status")
                    .slice(0, 4)
                    .map((col) => (
                      <div key={col.key}>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 truncate">
                          {col.label}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {col.render
                            ? col.render(row[col.key], row)
                            : String(row[col.key] ?? "")}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-2 md:px-6 py-2.5 md:py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 md:gap-3 text-xs">
          <span className="text-slate-400 text-xs md:text-sm order-2 sm:order-1">
            {(currentPage - 1) * perPage + 1}-
            {Math.min(currentPage * perPage, filtered.length)} dari{" "}
            {filtered.length}
          </span>
          <div className="flex gap-1 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 md:p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base md:text-lg">
                chevron_left
              </span>
            </button>
            {/* Smart pagination: show max 5 pages */}
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-lg font-bold transition-colors cursor-pointer text-xs md:text-sm ${
                    currentPage === pageNum
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 md:p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base md:text-lg">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
