import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Loader2, AppWindow } from 'lucide-react';

export function MyAppViewer() {
  const { appId } = useParams<{ appId: string }>();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      if (!appId) return;
      try {
        const docRef = doc(db, 'portal_documents', appId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setApp({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Error fetching app:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [appId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-postal-red animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading app...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <AppWindow className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">App Not Found</h2>
        <p className="text-slate-500 mb-6">The tool you are looking for does not exist or has been removed.</p>
        <Link to="/my-apps" className="bg-postal-red text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
          Back to My Apps
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 relative">
      <Link 
        to="/my-apps" 
        className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur text-slate-700 hover:text-postal-red hover:bg-white shadow-md rounded-full px-4 py-2 transition-all flex items-center gap-2 border border-slate-200 font-medium text-sm"
      >
        <ArrowLeft size={18} />
        Back
      </Link>
      <div className="flex-1 w-full h-full relative bg-[#f8f9fa] overflow-hidden">
        <iframe
          srcDoc={app.description || ''}
          title={app.name || 'Custom App'}
          className="w-full h-full border-0 select-auto outline-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
        />
      </div>
    </div>
  );
}
