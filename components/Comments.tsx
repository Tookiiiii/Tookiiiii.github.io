"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig } from '../siteConfig';

export default function Comments() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const commentConfig = siteConfig.comments || {};
  const repo = commentConfig.repo || 'Tookiiiii/Tookiiiii.github.io';
  const issueTerm = commentConfig.issueTerm || 'pathname';
  const label = commentConfig.label || 'comment';

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('repo', repo);
    script.setAttribute('issue-term', issueTerm);
    script.setAttribute('label', label);
    script.setAttribute(
      'theme',
      document.documentElement.classList.contains('dark') ? 'github-dark' : 'github-light'
    );

    containerRef.current.appendChild(script);
  }, [pathname, repo, issueTerm, label]);

  return (
    <div className="w-full mt-16 relative">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>
      <div className="relative z-10 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10 p-3 shadow-sm">
          <div ref={containerRef} className="min-h-[180px]" />
        </div>
      </div>
    </div>
  );
}
