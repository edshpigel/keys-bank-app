"use client";

import { Alert, Button, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { LuggageLockSheet } from "@/components/luggage-lock-sheet";
import {
  api,
  type LuggageGridCell,
  type LuggageGridItem,
  type LuggageGridResponse,
  type PointListItem,
} from "@/lib/api";
import { luggageDotClass, luggageStateLabel } from "@/lib/luggage";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

function cellToItem(
  cell: LuggageGridCell,
  byId: Map<string, LuggageGridItem>,
  byLabel: Map<string, LuggageGridItem>,
): LuggageGridItem | null {
  const rawId = cell.item?.id ? String(cell.item.id) : "";
  if (rawId && byId.has(rawId)) return byId.get(rawId) ?? null;
  const label = String(cell.label || cell.item?.label || "").trim();
  if (label && byLabel.has(label)) return byLabel.get(label) ?? null;
  return null;
}

function LuggageBoard({
  cells,
  items,
  selectedId,
  onSelect,
}: {
  cells: LuggageGridCell[];
  items: LuggageGridItem[];
  selectedId?: string | null;
  onSelect: (item: LuggageGridItem) => void;
}) {
  const t = useT();
  const byId = useMemo(() => new Map(items.map((i) => [i.unit_id, i])), [items]);
  const byLabel = useMemo(() => new Map(items.map((i) => [String(i.label).trim(), i])), [items]);

  const rows = useMemo(() => {
    const byRow = new Map<number, LuggageGridCell[]>();
    for (const cell of cells) {
      const row = Number(cell.row) || 1;
      const list = byRow.get(row) ?? [];
      list.push(cell);
      byRow.set(row, list);
    }
    return [...byRow.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([row, rowCells]) => ({
        row,
        cells: [...rowCells].sort((a, b) => (Number(a.col) || 0) - (Number(b.col) || 0)),
      }));
  }, [cells]);

  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl bg-[#3c434a] p-2.5">
      <div className="flex w-max min-w-full flex-col gap-2.5">
        {rows.map(({ row, cells: rowCells }) => {
          let prevGridCol = 0;
          return (
            <div key={row} className="flex flex-nowrap items-stretch gap-[7px]" role="list">
              {rowCells.map((cell, idx) => {
                const gridCol = Number(cell.grid_col || cell.col) || 0;
                const gap =
                  prevGridCol > 0 && gridCol > prevGridCol + 1 ? (
                    <div key={`gap-${row}-${idx}`} className="w-3 shrink-0" aria-hidden />
                  ) : null;
                prevGridCol = gridCol;

                if (cell.kind === "screen") {
                  return (
                    <div key={`screen-${row}-${idx}`} className="contents">
                      {gap}
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#1d2327] px-1 text-center text-[9px] font-bold leading-tight tracking-wide text-white"
                        aria-hidden
                      >
                        {cell.title || "LOCKS SCREEN"}
                      </div>
                    </div>
                  );
                }

                const item = cellToItem(cell, byId, byLabel);
                const label = String(cell.label || item?.label || "—");
                if (!item) {
                  return (
                    <div key={`unmapped-${row}-${idx}`} className="contents">
                      {gap}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-[#1d2327]/45 bg-white/40 text-sm font-extrabold text-brand-text/50">
                        {label}
                      </div>
                    </div>
                  );
                }

                const active = selectedId === item.unit_id;
                return (
                  <div key={item.unit_id} className="contents">
                    {gap}
                    <button
                      type="button"
                      role="listitem"
                      aria-label={`${t("luggage.sheetTitle", { label: item.label })} (${luggageStateLabel(item, t)})`}
                      className={cn(
                        "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-2 border-[#1d2327] bg-white text-sm font-extrabold text-brand-text transition active:scale-[0.97]",
                        active && "bg-[rgba(195,161,100,0.32)]",
                      )}
                      onClick={() => onSelect(item)}
                    >
                      <span
                        className={cn(
                          "absolute right-[5px] top-[5px] h-[9px] w-[9px] rounded-full shadow-[0_0_0_1.5px_#141414]",
                          luggageDotClass(item),
                        )}
                        aria-hidden
                      />
                      {item.label}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PointLuggagePage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const pointId = params.id;
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<LuggageGridItem | null>(null);

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["operator", "luggage", pointId],
    queryFn: () => api.get<LuggageGridResponse>(`points/${pointId}/luggage-locks`),
    enabled: Boolean(pointId),
  });

  const items = data?.items ?? [];
  const cells = data?.grid?.cells ?? [];
  const hasBoard = cells.length > 0;

  function onActionDone() {
    void queryClient.invalidateQueries({ queryKey: ["operator", "luggage", pointId] });
    void queryClient.invalidateQueries({ queryKey: ["operator", "lock-actions", pointId] });
  }

  return (
    <>
      <AppHeader
        title={t("luggage.title")}
        subtitle={point?.name_short}
        backHref={`/point/${pointId}/`}
        backSide="end"
        size="lg"
      />
      <div className="flex-1">
        <div className="mb-4 flex justify-end">
          <Button
            variant="secondary"
            className="h-9 px-4 text-sm"
            isDisabled={isFetching}
            onPress={() => void refetch()}
          >
            {isFetching ? t("common.loading") : t("luggage.refresh")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-brand-gold" />
          </div>
        ) : null}
        {error ? <Alert status="danger">{t("luggage.loadError")}</Alert> : null}

        {!isLoading && !error ? (
          items.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text-muted">{t("luggage.empty")}</p>
          ) : hasBoard ? (
            <div className="rounded-2xl border border-brand-border bg-white p-3 shadow-sm">
              <LuggageBoard
                cells={cells}
                items={items}
                selectedId={selected?.unit_id}
                onSelect={setSelected}
              />
            </div>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-[7px]">
              {items.map((item) => (
                <li key={item.unit_id}>
                  <button
                    type="button"
                    aria-label={`${t("luggage.sheetTitle", { label: item.label })} (${luggageStateLabel(item, t)})`}
                    className="relative flex aspect-square min-h-[52px] w-full items-center justify-center rounded-lg border-[1.5px] border-brand-text bg-white text-sm font-extrabold transition active:scale-[0.97]"
                    onClick={() => setSelected(item)}
                  >
                    <span
                      className={cn(
                        "absolute right-1.5 top-1.5 h-[9px] w-[9px] rounded-full shadow-[0_0_0_1.5px_#141414]",
                        luggageDotClass(item),
                      )}
                      aria-hidden
                    />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>

      <LuggageLockSheet
        open={Boolean(selected)}
        lock={selected}
        pointId={pointId}
        timeZone={point?.timezone}
        onClose={() => setSelected(null)}
        onActionDone={onActionDone}
      />
    </>
  );
}
