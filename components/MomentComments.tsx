"use client";

import { useEffect, useRef } from 'react';
import { siteConfig } from '../siteConfig';

interface MomentCommentsProps {
  id: string;
}

export default function MomentComments({ id }: MomentCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedKeyRef = useRef('');
  const commentConfig = siteConfig.comments || {};
  const repo = commentConfig.repo || 'Tookiiiii/Tookiiiii.github.io';
  const label = commentConfig.label || 'moment';

  useEffect(() => {
    if (!containerRef.current) return;

    const key = `${id}|${repo}|${label}|${document.documentElement.classList.contains('dark')}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;

    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('repo', repo);
    script.setAttribute('issue-term', id.substring(0, 49));
    script.setAttribute('label', label);
    script.setAttribute(
      'theme',
      document.documentElement.classList.contains('dark') ? 'github-dark' : 'github-light'
    );

    containerRef.current.appendChild(script);
  }, [id, repo, label]);

  return (
    <div className="w-full relative rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10 p-3">
      <div ref={containerRef} className="min-h-[120px]" />
    </div>
  );
}
