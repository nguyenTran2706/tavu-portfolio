import { User } from 'lucide-react';
import Section from '@/components/ui/Section';
import Portrait from '@/components/ui/Portrait';
import ImageReveal from '@/components/ui/ImageReveal';
import { ToConfirm } from '@/components/ui/ToConfirm';
import { identity, skillGroups, contact, isToConfirm } from '@/content/profile';

export default function About() {
  return (
    <Section
      id="about"
      num="01"
      label="About"
      title="An operator who reads the export, not the dashboard summary."
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="reveal lg:col-span-5">
          <ImageReveal className="surface relative aspect-[4/5] overflow-hidden">
            {isToConfirm(contact.headshot) ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-[radial-gradient(80%_60%_at_50%_0%,#211e19,#191713)] p-8 text-center">
                <User aria-hidden="true" className="h-10 w-10 text-ink-muted/60" />
                <ToConfirm label={contact.headshot.__toConfirm} />
                <p className="max-w-[26ch] text-sm text-ink-muted">
                  No portrait was supplied with the source documents. Drop one in
                  <code className="mx-1 font-mono text-[0.75rem] text-ink-secondary">public/</code>
                  and point <code className="font-mono text-[0.75rem] text-ink-secondary">contact.headshot</code> at it.
                </p>
              </div>
            ) : (
              <Portrait
                src={contact.headshot}
                alt={`${identity.name}, ${identity.title}`}
                name={identity.name}
              />
            )}
          </ImageReveal>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-tile border border-hairline bg-hairline">
            <div className="bg-card p-4">
              <dt className="eyebrow">Based in</dt>
              <dd className="mt-1.5 text-sm text-ink-secondary">{identity.location}</dd>
            </div>
            <div className="bg-card p-4">
              <dt className="eyebrow">Work rights</dt>
              <dd className="mt-1.5 text-sm text-ink-secondary">
                Temporary Graduate visa (subclass 485)
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7">
          <p className="reveal text-lg leading-relaxed text-ink-secondary">{identity.summary}</p>

          <div className="reveal mt-12">
            <h3 className="eyebrow mb-5">Capabilities</h3>
            {/* Bento: the widest group leads and spans two columns. */}
            <ul className="grid gap-3 sm:grid-cols-2">
              {skillGroups.map((group, i) => (
                <li
                  key={group.label}
                  className={`surface p-5 transition-colors duration-200 ease-out hover:bg-raised ${
                    i === 0 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <h4 className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-accent">
                    {group.label}
                  </h4>
                  <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="rounded border border-hairline px-2 py-1 text-[0.8125rem] text-ink-secondary"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-muted">
              Groups are taken verbatim from the résumé. There is no machine-learning entry
              because the source document contains none.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
