import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AppWindow } from 'lucide-react';
import { Link } from 'react-router-dom';

const CARD_COLORS = [
  'bg-[#5b6bb0]',
  'bg-[#4fb794]',
  'bg-[#c64841]',
  'bg-[#db8b2a]',
  'bg-[#9652b4]',
  'bg-[#48c36b]',
  'bg-[#3b83d1]',
  'bg-[#eab237]',
  'bg-[#859497]',
  'bg-[#d7742b]',
  'bg-[#4359a8]',
  'bg-[#359b92]',
  'bg-[#c33140]',
  'bg-[#6caec8]',
  'bg-gradient-to-br from-[#87c947] to-[#c64841]',
  'bg-[#5b95d6]',
  'bg-[#15274d]',
  'bg-[#8072d6]',
  'bg-[#3c4651]',
  'bg-[#f88158]'
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
      <div className="mx-auto max-w-[95%] px-4 sm:px-6 lg:px-8">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {myApps.map((app, index) => {
              const colorClass = CARD_COLORS[index % CARD_COLORS.length];
              return (
                <Link
                  to={`/my-apps/${app.id}`}
                  key={app.id} 
                  className={`group flex items-center justify-center p-6 min-h-[140px] rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${colorClass}`}
                >
                  <h3 className="font-bold text-white text-base md:text-lg text-center break-words leading-tight">
                     {app.name || 'Custom App'}
                  </h3>
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
