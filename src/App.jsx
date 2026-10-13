import {lazy, Suspense} from 'react';
import {ResumeAccessProvider} from './components/ResumeAccess';
import {MotionConfig} from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Education from './components/Education';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import Footer from './components/Footer';
import usePointerEffectsEnabled from './hooks/usePointerEffectsEnabled';

const CustomCursor = lazy(() => import('./components/CustomCursor'));
const PointerEffects = lazy(() => import('./components/PointerEffects'));

export default function App() {
  const pointerEffectsEnabled = usePointerEffectsEnabled();

  return (
    <ResumeAccessProvider><MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-black-bg text-silver-300 selection:bg-accent/25 selection:text-white">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-accent-deep rounded-full blur-[150px] opacity-20" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-700 rounded-full blur-[150px] opacity-20" />
          <div className="absolute bottom-10 left-1/4 w-[300px] h-[300px] bg-accent rounded-full blur-[150px] opacity-10" />
        </div>
        {pointerEffectsEnabled && (
          <Suspense fallback={null}>
            <CustomCursor />
            <PointerEffects />
          </Suspense>
        )}
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          <Hero /><About /><Experience /><Education /><Projects /><Skills /><Certifications /><Contact />
        </main>
        <Footer />
      </div>
    </MotionConfig></ResumeAccessProvider>
  );
}
