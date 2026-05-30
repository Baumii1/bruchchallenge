
"use client";

import { HyperatePulseStrip } from '@/components/obs/HyperatePulseStrip';

export default function ObsPulsePage() {
  return (
    <div className="obs-page-root obs-browser-source fixed inset-0 z-50 flex items-start justify-start bg-transparent p-0 text-white">
      <section className="relative isolate overflow-hidden rounded-[26px] border border-white/10 bg-[#050812]/95 p-3 shadow-2xl">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(244,63,94,0.20),transparent_34%),radial-gradient(circle_at_92%_0%,rgba(41,171,226,0.20),transparent_30%),linear-gradient(180deg,rgba(8,13,28,0.96),rgba(3,5,12,0.99))]" />
        <HyperatePulseStrip />
      </section>
    </div>
  );
}
