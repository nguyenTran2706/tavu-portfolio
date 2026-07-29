import Section from '@/components/ui/Section';
import Dashboard from '@/components/dashboard/Dashboard';
import { experience, identity } from '@/content/profile';
import { loadStoreData } from '@/lib/ebay.server';

/**
 * Server component: the CSVs are read here, at build time, and only the
 * anonymised aggregate shapes are handed to the client `Dashboard`.
 */
export default function Experience() {
  const data = loadStoreData();

  return (
    <Section
      id="experience"
      num="03"
      label="Experience"
      title="Three roles, and the store I can show you the numbers for."
    >
      {/* (a) Narrative roles */}
      <ol className="space-y-3">
        {experience.map((role) => (
          <li key={`${role.role}-${role.org}`} className="reveal surface p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
              <div>
                <h3 className="text-xl">
                  {role.role}
                  {role.current && (
                    <span className="ml-3 inline-flex items-center gap-1.5 align-middle font-mono text-[0.625rem] uppercase tracking-[0.12em] text-status-good">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-status-good" />
                      Current
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-ink-secondary">
                  {role.org} · {role.location}
                </p>
              </div>
              <span className="font-mono text-[0.75rem] uppercase tracking-[0.12em] tabular-nums text-ink-muted">
                {role.period}
              </span>
            </div>

            <ul className="mt-6 space-y-3 border-t border-hairline pt-6">
              {role.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-secondary">
                  <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {bullet}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {/* (b) The dashboard */}
      <div className="mt-20">
        <div className="reveal max-w-3xl">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-eyebrow uppercase tabular-nums text-accent">03b</span>
            <span className="eyebrow">{identity.brand} — Sales intelligence</span>
          </div>
          <h3 className="mt-5 text-[clamp(1.75rem,4vw,2.5rem)] leading-tight">
            The store, rebuilt from the raw exports.
          </h3>
          <p className="mt-5 text-ink-secondary">
            The bullet points above are the claim. This is the working. Every figure below is
            computed from unmodified eBay Seller Hub CSVs when the site builds — no number is
            typed in, so none of them can drift from the source. Filter it and the narrative,
            the tiles and the charts all recompute together.
          </p>
        </div>

        <Dashboard data={data} />
      </div>
    </Section>
  );
}
