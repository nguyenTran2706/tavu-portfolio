// Lucide dropped its brand icons (Github/Linkedin) at v1, so these are the
// closest generic equivalents rather than third-party brand marks.
import { ArrowUp, FolderGit2, Link2, Mail, Phone, Store } from 'lucide-react';
import { ToConfirm } from '@/components/ui/ToConfirm';
import { contact, identity, isToConfirm } from '@/content/profile';

const year = new Date().getFullYear();

export default function Contact() {
  return (
    <footer id="contact" className="scroll-mt-24 border-t border-hairline pt-24 sm:pt-32">
      <div className="shell pb-14">
        <div className="reveal">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-eyebrow uppercase tabular-nums text-accent">06</span>
            <span className="eyebrow">Contact</span>
          </div>
          <h2 className="mt-6 max-w-[16ch] text-hero">{contact.closingLine}</h2>
          <p className="mt-7 max-w-xl text-lg text-ink-secondary">
            Open to E-commerce Operations roles in Sydney. The analysis behind section 03 —
            script and raw exports, buyer columns removed — is available on request.
          </p>
        </div>

        <ul className="reveal mt-14 grid gap-px overflow-hidden rounded-card border border-hairline bg-hairline sm:grid-cols-2">
          <ContactRow icon={<Mail aria-hidden="true" className="h-4 w-4" />} label="Email">
            <a href={`mailto:${contact.email}`} className="link-underline break-all">
              {contact.email}
            </a>
          </ContactRow>

          <ContactRow icon={<Phone aria-hidden="true" className="h-4 w-4" />} label="Phone">
            <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="link-underline">
              {contact.phone}
            </a>
          </ContactRow>

          <ContactRow icon={<Link2 aria-hidden="true" className="h-4 w-4" />} label="LinkedIn">
            <a
              href={contact.linkedin.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline break-all"
            >
              {contact.linkedin.label}
            </a>
          </ContactRow>

          <ContactRow icon={<FolderGit2 aria-hidden="true" className="h-4 w-4" />} label="GitHub">
            {isToConfirm(contact.github) ? (
              <ToConfirm label={contact.github.__toConfirm} />
            ) : (
              <a
                href={contact.github}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline break-all"
              >
                {contact.github.replace(/^https?:\/\//, '')}
              </a>
            )}
          </ContactRow>

          <ContactRow
            icon={<Store aria-hidden="true" className="h-4 w-4" />}
            label="eBay store"
            wide
          >
            {isToConfirm(contact.store) ? (
              <ToConfirm label={contact.store.__toConfirm} />
            ) : (
              <a
                href={contact.store}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline break-all"
              >
                {contact.store.replace(/^https?:\/\//, '')}
                <span className="ml-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-muted">
                  — the store behind section 03
                </span>
              </a>
            )}
          </ContactRow>
        </ul>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-hairline pt-7">
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-muted">
            © {year} {identity.name} · {identity.brand}
          </p>
          <a
            href="#top"
            className="group inline-flex cursor-pointer items-center gap-2 font-mono text-[0.75rem]
                       uppercase tracking-[0.12em] text-ink-muted transition-colors duration-200
                       hover:text-accent-hover"
          >
            Back to top
            <ArrowUp
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}

function ContactRow({
  icon,
  label,
  children,
  wide,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <li className={`bg-card p-6 ${wide ? 'sm:col-span-2' : ''}`}>
      <p className="eyebrow flex items-center gap-2 text-accent">
        {icon}
        {label}
      </p>
      <div className="mt-2.5 text-ink-secondary">{children}</div>
    </li>
  );
}
