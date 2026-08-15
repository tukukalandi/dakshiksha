import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AppWindow, ExternalLink, Clock, Link2, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const CARD_COLORS = [
  { bg: 'bg-[#d63435]', dark: 'bg-[#b82d2e]', shadow: 'shadow-[#d63435]/20' },
  { bg: 'bg-[#218c75]', dark: 'bg-[#1b7360]', shadow: 'shadow-[#218c75]/20' },
  { bg: 'bg-[#e29339]', dark: 'bg-[#c27c2e]', shadow: 'shadow-[#e29339]/20' },
  { bg: 'bg-[#2979b9]', dark: 'bg-[#216398]', shadow: 'shadow-[#2979b9]/20' },
  { bg: 'bg-[#9853b4]', dark: 'bg-[#7c4493]', shadow: 'shadow-[#9853b4]/20' },
  { bg: 'bg-[#4359a8]', dark: 'bg-[#37498c]', shadow: 'shadow-[#4359a8]/20' },
  { bg: 'bg-[#3c4651]', dark: 'bg-[#2f3740]', shadow: 'shadow-[#3c4651]/20' },
  { bg: 'bg-[#d7742b]', dark: 'bg-[#b86121]', shadow: 'shadow-[#d7742b]/20' }
];

export function MyAppsPage() {
  const [myApps, setMyApps] = useState<any[]>([]);

  useEffect(() => {
    const qMyApps = query(
      collection(db, 'portal_documents'),
      where('category', '==', 'My Apps')
    );
    const unsubscribeMyApps = onSnapshot(qMyApps, (snapshot) => {
      const sortedDocs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setMyApps(sortedDocs);
    });
    return () => unsubscribeMyApps();
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-postal-dark-maroon uppercase mb-4 tracking-tight flex justify-center items-center gap-3">
            <AppWindow size={36} className="text-postal-red" />
            MY APPS
          </h1>
          <p className="text-lg font-medium text-slate-500">
            Access all available tools and applications
          </p>
        </div>

        {myApps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myApps.map((app, index) => {
              const color = CARD_COLORS[index % CARD_COLORS.length];
              return (
                <Link
                  to={`/my-apps/${app.id}`}
                  key={app.id} 
                  className={cn(
                    "flex items-stretch overflow-hidden rounded-lg shadow-md transition-all hover:scale-[1.02] hover:-translate-y-1 h-32 group relative",
                    color.bg,
                    color.shadow
                  )}
                >
                  {/* Left Icon Section */}
                  <div className={cn("w-24 flex items-center justify-center shrink-0 border-r border-white/10", color.dark)}>
                    <div className="bg-white/95 p-4 rounded-full shadow-lg text-slate-700 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      <Link2 size={28} />
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-5 flex flex-col justify-center min-w-0 pr-12 lg:pr-16">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-2.5 py-1 rounded text-white border border-white/10 shadow-sm">
                        EXTERNAL LINK
                      </span>
                    </div>
                    <h3 className="text-white font-black text-base sm:text-lg lg:text-xl tracking-tight leading-tight group-hover:underline decoration-white/40 underline-offset-4 line-clamp-2">
                      {app.name ? app.name : 'Custom App'}
                    </h3>
                  </div>

                  {/* Floating Actions */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                     <div className="p-1 rounded bg-black/10 text-white">
                       <ExternalLink size={14} />
                     </div>
                  </div>
                  
                  <div className="absolute bottom-2 right-3 flex items-center gap-1.5 pointer-events-none">
                     <div className="flex items-center text-[8px] text-white/50 uppercase tracking-[0.15em] font-black">
                       <Clock size={10} className="mr-1" />
                       {app.createdAt?.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                     </div>
                     <Download size={14} className="text-white/80 group-hover:scale-125 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200 max-w-4xl mx-auto">
            <AppWindow size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-500">No apps available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
