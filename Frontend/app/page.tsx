"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FileSearch, CodeSquare, ShieldCheck } from "lucide-react";
import { FaGithub } from "react-icons/fa6";

export default function Home() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-[var(--color-brand-800)] selection:text-white">
      {/* Navbar */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="font-display font-bold text-2xl tracking-tighter text-[var(--color-brand-900)] dark:text-white">
          Verif<span className="text-[var(--color-brand-500)]">AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/docs" className="text-sm font-semibold text-[var(--on-surface-muted)] hover:text-[var(--on-surface)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--surface-dim)]">
            API Docs
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-center justify-center text-center min-h-[90vh]">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center justify-center space-y-6">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-950)] text-[var(--color-brand-800)] dark:text-blue-300 font-semibold text-sm border border-[var(--color-brand-200)] dark:border-[var(--color-brand-800)]">
            <ShieldCheck size={16} />
            Architectural Authority Standard
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="font-display font-bold text-5xl md:text-7xl lg:text-8xl tracking-tighter max-w-4xl text-[var(--on-surface)]">
            We read the resume. <br />
            <span className="text-[var(--color-brand-800)] dark:text-[var(--color-brand-500)]">You get the truth.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="max-w-2xl text-lg md:text-xl text-[var(--on-surface-muted)] leading-relaxed">
            Upload a candidate's resume and get an instant fact-check on their coding profiles, ATS compatibility, and GitHub history. We verify so you don't have to.
          </motion.p>

          <motion.div variants={fadeUp} className="pt-8">
            <Link href="/upload" className="inline-flex items-center justify-center px-8 py-4 rounded-md text-white bg-gradient-to-br from-[var(--color-brand-800)] to-[var(--color-brand-600)] hover:from-[var(--color-brand-900)] hover:to-[var(--color-brand-700)] font-semibold text-lg transition-transform hover:scale-105 active:scale-95 shadow-xl">
              Verify a Resume
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll down indicator */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 1.5, repeat: Infinity, repeatType: "reverse", duration: 1 }}
          className="absolute bottom-10"
        >
          <div className="w-[1px] h-12 bg-[var(--color-brand-300)]" />
        </motion.div>
      </main>

      {/* Value Proposition */}
      <section className="py-24 px-6 bg-[var(--surface-dim)]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "GitHub Verification",
                desc: "We scan the codebase. Found a project on the resume without actual commits? We flag it.",
                icon: <FaGithub size={32} className="mb-4 text-[var(--color-brand-800)]" />
              },
              {
                title: "Coding Profiles",
                desc: "LeetCode, Codeforces, & CodeChef ratings pulled directly via APIs to combat score inflation.",
                icon: <CodeSquare size={32} className="mb-4 text-[var(--color-brand-800)]" />
              },
              {
                title: "ATS Deep Dive",
                desc: "Detailed breakdown of parsing issues, ensuring you aren't fighting formatting errors.",
                icon: <FileSearch size={32} className="mb-4 text-[var(--color-brand-800)]" />
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeUp} className="glass-panel p-8 rounded-2xl">
                {feature.icon}
                <h3 className="font-display font-semibold text-2xl mb-3">{feature.title}</h3>
                <p className="text-[var(--on-surface-muted)] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
