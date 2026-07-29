'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { cx } from '@/lib/format';

export interface TableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  numeric?: boolean;
}

/**
 * A chart and its table-view twin.
 *
 * The table is what renders on the server and before hydration, so every value
 * is present in the HTML — readable without JavaScript, and by a screen reader,
 * without depending on the SVG. The chart replaces it once mounted; the toggle
 * lets anyone go back. Per the dataviz rules, a tooltip is never the only route
 * to a number.
 */
export default function ChartCard<T>({
  title,
  caption,
  rows,
  columns,
  children,
  className,
  height = 260,
}: {
  title: string;
  caption?: string;
  rows: T[];
  columns: TableColumn<T>[];
  children: ReactNode;
  className?: string;
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const hostRef = useRef<HTMLElement>(null);

  useEffect(() => setMounted(true), []);

  // Charts mount only once scrolled to, which is what makes their draw-in
  // animation land as the card arrives rather than having already finished
  // off-screen. It also keeps a dozen Recharts trees out of the first paint.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '80px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const asTable = !mounted || !inView || showTable;

  return (
    <section ref={hostRef} className={cx('surface flex flex-col p-5 sm:p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h4 className="font-display text-base font-semibold leading-snug text-ink">{title}</h4>
          {caption && <p className="mt-1 text-[0.8125rem] leading-snug text-ink-muted">{caption}</p>}
        </div>

        {mounted && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            aria-controls={tableId}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded border border-hairline
                       px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-muted
                       transition-colors duration-200 ease-out hover:border-accent/50 hover:text-ink-secondary"
          >
            {showTable ? (
              <>
                <BarChart3 aria-hidden="true" className="h-3.5 w-3.5" /> Chart
              </>
            ) : (
              <>
                <Table2 aria-hidden="true" className="h-3.5 w-3.5" /> Table
              </>
            )}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-center text-sm text-ink-muted">
          No orders match the current filters.
        </p>
      ) : asTable ? (
        <div id={tableId} className="-mx-1 flex-1 overflow-x-auto">
          <table className="w-full min-w-[18rem] border-collapse text-[0.8125rem]">
            <thead>
              <tr className="border-b border-hairline">
                {columns.map((c) => (
                  <th
                    key={c.header}
                    scope="col"
                    className={cx(
                      'px-1 pb-2 font-mono text-[0.6875rem] font-normal uppercase tracking-[0.1em] text-ink-muted',
                      c.numeric ? 'text-right' : 'text-left',
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-hairline/60 last:border-0">
                  {columns.map((c) => (
                    <td
                      key={c.header}
                      className={cx(
                        'px-1 py-2 text-ink-secondary',
                        c.numeric ? 'text-right tabular-nums' : 'text-left',
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Height includes the x-axis band, so the axis never gets its own scrollbar.
        <div style={{ height }} className="flex-1">
          {children}
        </div>
      )}
    </section>
  );
}
