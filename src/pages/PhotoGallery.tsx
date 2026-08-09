import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, ImageIcon } from 'lucide-react';

export function PhotoGallery() {
  const [photoGallery, setPhotoGallery] = useState<any[]>([]);

  useEffect(() => {
    const qGallery = query(
      collection(db, 'portal_documents'),
      where('category', '==', 'Photo Gallery')
    );
    const unsubscribeGallery = onSnapshot(qGallery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedDocs = docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setPhotoGallery(sortedDocs);
    });

    return () => {
      unsubscribeGallery();
    };
  }, []);

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-postal-red">
              <h2 className="text-2xl font-bold text-postal-red flex items-center gap-2 uppercase tracking-wide">
                <ImageIcon size={24} /> Photo Gallery
              </h2>
            </div>
            
            {photoGallery.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photoGallery.map((photo) => (
                  <div key={photo.id} className="group cursor-pointer">
                    <div className="relative h-48 rounded-lg overflow-hidden bg-slate-100 shadow-sm border border-slate-200 mb-3">
                      <img
                        src={photo.link}
                        alt={photo.name || 'Gallery Image'}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Search className="text-white w-8 h-8 opacity-75" />
                      </div>
                    </div>
                    {photo.name && (
                      <p className="text-sm font-medium text-slate-700 text-center break-words">
                        {photo.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                <p>No photos available in the gallery.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
