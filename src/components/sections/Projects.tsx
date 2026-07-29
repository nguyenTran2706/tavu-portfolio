import { Boxes, Code2, ExternalLink } from 'lucide-react';
import Section from '@/components/ui/Section';
import TiltCard from '@/components/ui/TiltCard';
import { ToConfirm } from '@/components/ui/ToConfirm';
import { projects, isToConfirm } from '@/content/profile';

export default function Projects() {
  return (
    <Section
      id="projects"
      num="04"
      label="Projects"
      title="Software built from the operational requirements, not the tutorial."
      lede="The résumé lists one project. It is shown here in full rather than padded out with work that isn't in the source document."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {projects.map((project) => (
          <TiltCard key={project.name} className="reveal">
            <article className="surface flex h-full flex-col p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl">{project.name}</h3>
                  <p className="mt-1.5 text-ink-secondary">{project.tagline}</p>
                </div>
                <Boxes aria-hidden="true" className="h-6 w-6 shrink-0 text-accent/70" />
              </div>

              <ul className="mt-5 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <li key={tech} className="chip">
                    {tech}
                  </li>
                ))}
              </ul>

              <ul className="mt-6 space-y-3 border-t border-hairline pt-6">
                {project.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 text-[0.9375rem] text-ink-secondary">
                    <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {bullet}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-3 pt-1">
                {isToConfirm(project.liveUrl) ? (
                  <ToConfirm label={project.liveUrl.__toConfirm} />
                ) : (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline inline-flex items-center gap-1.5 text-sm"
                  >
                    <ExternalLink aria-hidden="true" className="h-4 w-4" /> Live demo
                  </a>
                )}
                {isToConfirm(project.codeUrl) ? (
                  <ToConfirm label={project.codeUrl.__toConfirm} />
                ) : (
                  <a
                    href={project.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline inline-flex items-center gap-1.5 text-sm"
                  >
                    <Code2 aria-hidden="true" className="h-4 w-4" /> Source
                  </a>
                )}
              </div>
            </article>
          </TiltCard>
        ))}

        {/* This site is itself an artefact of the same skillset — worth saying, in its own voice. */}
        <TiltCard className="reveal">
          <article className="surface flex h-full flex-col justify-between p-6 sm:p-8">
            <div>
              <h3 className="text-2xl">This site</h3>
              <p className="mt-1.5 text-ink-secondary">
                Portfolio with an embedded sales-intelligence dashboard
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {['Next.js', 'TypeScript', 'React Three Fiber', 'GSAP', 'Recharts'].map((t) => (
                  <li key={t} className="chip">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-6 border-t border-hairline pt-6 text-[0.9375rem] text-ink-secondary">
              Section 03 is not a screenshot. It parses the raw Seller Hub exports at build
              time and recomputes every figure — so swapping the CSVs changes the numbers on
              the page, and none of them can drift from the source.
            </p>
          </article>
        </TiltCard>
      </div>
    </Section>
  );
}
