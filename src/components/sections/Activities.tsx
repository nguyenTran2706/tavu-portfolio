import { Award, ExternalLink, HeartHandshake } from 'lucide-react';
import Section from '@/components/ui/Section';
import { ToConfirm } from '@/components/ui/ToConfirm';
import { certifications, activities, isToConfirm } from '@/content/profile';

export default function Activities() {
  return (
    <Section
      id="activities"
      num="05"
      label="Activities & Certifications"
      title="Credentials, and the volunteering that came before the store."
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <h3 className="reveal eyebrow mb-5">Certifications</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {certifications.map((cert) => (
              <li
                key={cert.name}
                className="reveal surface flex flex-col justify-between gap-5 p-6 transition-colors duration-200 ease-out hover:bg-raised"
              >
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-display text-lg font-semibold leading-snug">{cert.name}</h4>
                  <Award aria-hidden="true" className="h-5 w-5 shrink-0 text-accent/70" />
                </div>
                <div>
                  <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] tabular-nums text-ink-muted">
                    {cert.issuer}
                  </p>
                  {cert.issued && (
                    <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] tabular-nums text-ink-muted/80">
                      Issued {cert.issued}
                      {cert.expires && ` · valid to ${cert.expires}`}
                    </p>
                  )}
                  <div className="mt-3">
                    {isToConfirm(cert.credentialUrl) ? (
                      <ToConfirm label={cert.credentialUrl.__toConfirm} />
                    ) : (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline inline-flex items-center gap-1.5 text-sm"
                      >
                        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                        Verify credential
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5">
          <h3 className="reveal eyebrow mb-5">Volunteering</h3>
          <ul className="space-y-3">
            {activities.map((item) => (
              <li key={item.name} className="reveal surface p-6">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-display text-lg font-semibold leading-snug">{item.name}</h4>
                  <HeartHandshake aria-hidden="true" className="h-5 w-5 shrink-0 text-accent/70" />
                </div>
                <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">{item.org}</p>
                <p className="mt-1 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-muted">
                  {item.period}
                </p>
                <p className="mt-4 border-t border-hairline pt-4 text-[0.9375rem] text-ink-secondary">
                  {item.note}
                </p>
              </li>
            ))}
          </ul>
          <p className="reveal mt-4 text-sm text-ink-muted">
            The résumé lists no hackathons or awards, so none are shown. This section reflects
            what the source document actually contains.
          </p>
        </div>
      </div>
    </Section>
  );
}
