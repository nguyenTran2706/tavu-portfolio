import Section from '@/components/ui/Section';
import TimelineRule from '@/components/ui/TimelineRule';
import { education } from '@/content/profile';

export default function Education() {
  return (
    <Section
      id="education"
      num="02"
      label="Education"
      title="Information Technology at UTS, alongside a live trading business."
    >
      <ol className="relative border-l border-hairline pl-6 sm:pl-10">
        <TimelineRule />
        {education.map((item) => (
          <li key={item.degree} className="reveal relative pb-12 last:pb-0">
            {/* Timeline node sits on the rule; decorative, so hidden from AT. */}
            <span
              aria-hidden="true"
              className="absolute -left-[1.6875rem] top-2 h-2.5 w-2.5 rounded-full border-2 border-page bg-accent sm:-left-[2.9375rem]"
            />
            <div className="surface p-6 transition-colors duration-200 ease-out hover:bg-raised sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h3 className="text-xl">{item.degree}</h3>
                <span className="font-mono text-[0.75rem] uppercase tracking-[0.12em] tabular-nums text-ink-muted">
                  {item.period}
                </span>
              </div>
              <p className="mt-1.5 text-ink-secondary">
                {item.institution} · {item.location}
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {item.details.map((d) => (
                  <li key={d} className="chip normal-case tracking-normal">
                    {d}
                  </li>
                ))}
              </ul>

              {item.coursework.length > 0 && (
                <div className="mt-6 border-t border-hairline pt-5">
                  <h4 className="eyebrow">Relevant coursework</h4>
                  <p className="mt-2.5 text-[0.9375rem] text-ink-secondary">
                    {item.coursework.join(' · ')}
                  </p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
