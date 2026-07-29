import { cx } from '@/lib/format';
import SplitText from './SplitText';

/** Shared section shell: numbered eyebrow, rule, heading, optional lede. */
export default function Section({
  id,
  num,
  label,
  title,
  lede,
  children,
  className,
}: {
  id: string;
  num: string;
  label: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cx('scroll-mt-24 py-24 sm:py-32', className)}
    >
      <div className="shell">
        <div className="reveal mb-12 border-t border-hairline pt-6 sm:mb-16">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-eyebrow uppercase tabular-nums text-accent">{num}</span>
            <span className="eyebrow">{label}</span>
          </div>
          <h2 id={`${id}-heading`} className="mt-5 max-w-3xl text-h2">
            <SplitText text={title} />
          </h2>
          {lede && <p className="mt-5 max-w-2xl text-ink-secondary">{lede}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
