import Nav from '@/components/Nav';
import Intro from '@/components/Intro';
import PointerGlow from '@/components/PointerGlow';
import SmoothScroll from '@/components/SmoothScroll';
import Hero from '@/components/hero/Hero';
import About from '@/components/sections/About';
import Education from '@/components/sections/Education';
import Experience from '@/components/sections/Experience';
import Projects from '@/components/sections/Projects';
import Activities from '@/components/sections/Activities';
import Contact from '@/components/sections/Contact';

export default function Page() {
  return (
    <>
      <Intro />
      <SmoothScroll />
      <PointerGlow />
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Education />
        <Experience />
        <Projects />
        <Activities />
      </main>
      <Contact />
    </>
  );
}
