import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AppWindow, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CARD_COLORS = [
  { bg: 'bg-blue-50', icon: 'text-blue-500', hoverBg: 'group-hover:bg-blue-500', hoverBorder: 'hover:border-blue-500/30', hoverIconText: 'group-hover:text-blue-500' },
  { bg: 'bg-green-50', icon: 'text-green-500', hoverBg: 'group-hover:bg-green-500', hoverBorder: 'hover:border-green-500/30', hoverIconText: 'group-hover:text-green-500' },
  { bg: 'bg-purple-50', icon: 'text-purple-500', hoverBg: 'group-hover:bg-purple-500', hoverBorder: 'hover:border-purple-500/30', hoverIconText: 'group-hover:text-purple-500' },
  { bg: 'bg-orange-50', icon: 'text-orange-500', hoverBg: 'group-hover:bg-orange-500', hoverBorder: 'hover:border-orange-500/30', hoverIconText: 'group-hover:text-orange-500' },
  { bg: 'bg-pink-50', icon: 'text-pink-500', hoverBg: 'group-hover:bg-pink-500', hoverBorder: 'hover:border-pink-500/30', hoverIconText: 'group-hover:text-pink-500' },
  { bg: 'bg-teal-50', icon: 'text-teal-500', hoverBg: 'group-hover:bg-teal-500', hoverBorder: 'hover:border-teal-500/30', hoverIconText: 'group-hover:text-teal-500' },
  { bg: 'bg-indigo-50', icon: 'text-indigo-500', hoverBg: 'group-hover:bg-indigo-500', hoverBorder: 'hover:border-indigo-500/30', hoverIconText: 'group-hover:text-indigo-500' },
  { bg: 'bg-amber-50', icon: 'text-amber-500', hoverBg: 'group-hover:bg-amber-500', hoverBorder: 'hover:border-amber-500/30', hoverIconText: 'group-hover:text-amber-500' }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {myApps.map((app, index) => {
              const color = CARD_COLORS[index % CARD_COLORS.length];
              return (
                <Link
                  to={`/my-apps/${app.id}`}
                  key={app.id} 
                  className={`group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${color.hoverBorder}`}
                >
                  <div className="p-8 flex items-center justify-center flex-1">
                    <div className={`w-20 h-20 ${color.bg} rounded-full flex items-center justify-center ${color.hoverBg} transition-colors duration-300`}>
                      <AppWindow size={40} className={`${color.icon} group-hover:text-white transition-colors duration-300`} />
                    </div>
                  </div>
                  <div className="bg-slate-50 border-t border-slate-100 p-5 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg line-clamp-1">
                       {app.name || 'Custom App'}
                    </h3>
                    <ChevronRight size={20} className={`text-slate-400 ${color.hoverIconText} transition-colors`} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <AppWindow size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-500">No apps available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
