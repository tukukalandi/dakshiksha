import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, FileText, FileSearch, 
  ListOrdered, Megaphone, ClipboardList, 
  Image as ImageIcon, Images, FilePlus, Trash2, Plus, UploadCloud, CheckCircle2, AlertCircle, Link as LinkIcon
} from 'lucide-react';

interface HomepageDoc {
  id: string;
  name: string;
  pdfLink: string;
  flipbookLink?: string;
  isNew?: boolean;
  category: string;
  createdAt: Timestamp;
}

const CATEGORIES = [
  "GDS TO MTS",
  "POSTMAN EXAM",
  "PA/SA EXAM",
  "LGO EXAM",
  "IP EXAM",
  "PO GUIDE",
  "POSTAL MANUALS",
  "ACCOUNTANT EXAM",
  "OTHERS"
];

export function AdminPortal() {
  const { user, profile, isAdmin, login, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<HomepageDoc[]>([]);
  const [portalDocs, setPortalDocs] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    pdfLink: '',
    description: '',
    flipbookLink: '',
    isNew: false
  });

  const [docFormData, setDocFormData] = useState({
    type: CATEGORIES[0],
    subType: '',
    fileName: '',
    description: '',
    externalLink: '',
    isNew: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('Documents');

  useEffect(() => {
    if (!isAdmin) return;

    // Homepage Docs
    const q = query(
      collection(db, 'portal_documents'), 
      where('category', '==', 'Homepage Docs'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(d => ({ 
        id: d.id, 
        name: d.data().name,
        pdfLink: d.data().link,
        flipbookLink: d.data().flipbookLink,
        isNew: d.data().isNew,
        category: d.data().category,
        createdAt: d.data().createdAt
      } as HomepageDoc)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'portal_documents'));

    // Other Portal Docs
    const qDocs = query(
      collection(db, 'portal_documents'),
      where('category', '!=', 'Homepage Docs')
    );

    const unsubscribeDocs = onSnapshot(qDocs, (snapshot) => {
      const sortedDocs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        
      setPortalDocs(sortedDocs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'portal_documents'));

    return () => {
      unsubscribe();
      unsubscribeDocs();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-slate-50">
        <div className="bg-white p-12 border border-slate-200 shadow-xl rounded-2xl max-w-md">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">Only authorized administrators can access the portal.</p>
          {!user ? (
            <button onClick={login} className="w-full bg-postal-red text-white py-3 rounded-xl font-bold">Sign In</button>
          ) : (
            <button onClick={logout} className="w-full border border-slate-300 py-3 rounded-xl font-bold">Logout</button>
          )}
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'portal_documents', id));
      setStatusMessage({ type: 'success', text: 'Document deleted successfully.' });
    } catch (error) {
      console.error("Delete Error:", error);
      setStatusMessage({ type: 'error', text: 'Failed to delete document.' });
    }
  };

  const handleDocSubmit = async (e: React.FormEvent, overrideType?: string) => {
    e.preventDefault();
    const submitType = overrideType || docFormData.type;
    if (!submitType || !docFormData.fileName) {
       setStatusMessage({ type: 'error', text: 'Please fill all required fields.' });
       return;
    }
    if (uploadMode === 'file' && !selectedFile) {
       setStatusMessage({ type: 'error', text: 'Please select a file.' });
       return;
    }
    if (uploadMode === 'link' && !docFormData.externalLink) {
       setStatusMessage({ type: 'error', text: 'Please provide a valid link.' });
       return;
    }

    setLoading(true);
    setStatusMessage({ type: 'success', text: uploadMode === 'file' ? 'Uploading file to Drive...' : 'Saving link...' });

    try {
      let finalLink = docFormData.externalLink;

      if (uploadMode === 'file' && selectedFile) {
        const token = getToken();
        if (!token) {
          setStatusMessage({ type: 'error', text: 'Google Drive authentication missing. Please click "Connect to Drive" in the sidebar.' });
          setLoading(false);
          return;
        }

      const folderId = '1wS6ZUxT4kKolf6FJOMNvntTYY7BANxGe'; // User's requested Google Drive Folder ID

      const metadata = {
        name: selectedFile.name,
        parents: [folderId]
      };

      const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      if (!initRes.ok) {
        throw new Error(`Failed to initialize upload: ${await initRes.text()}`);
      }

      const uploadUrl = initRes.headers.get('Location');
      if (!uploadUrl) {
        throw new Error('No upload URL received from Google Drive.');
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream'
        },
        body: selectedFile
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${await uploadRes.text()}`);
      }
      
      const fileData = await uploadRes.json();
      
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: 'reader', type: 'anyone' })
        });
      } catch (permError) {
        console.warn('Could not make file public:', permError);
      }

      const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}?fields=webViewLink`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!getRes.ok) throw new Error(`Failed to retrieve file link.`);
      
      const finalData = await getRes.json();
      finalLink = finalData.webViewLink;
    }

      await addDoc(collection(db, 'portal_documents'), {
        category: submitType,
        subType: docFormData.subType,
        name: docFormData.fileName,
        description: docFormData.description,
        isNew: docFormData.isNew,
        link: finalLink,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setStatusMessage({ type: 'success', text: 'Document uploaded successfully!' });
      setDocFormData({ type: CATEGORIES[0], subType: '', fileName: '', description: '', externalLink: '', isNew: false });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error("Upload Error:", error);
      setStatusMessage({ type: 'error', text: error.message || 'Failed to upload document.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'portal_documents'), {
        category: 'Homepage Docs',
        name: formData.title,
        link: formData.pdfLink,
        flipbookLink: formData.flipbookLink,
        isNew: formData.isNew,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setFormData({ title: '', pdfLink: '', flipbookLink: '', isNew: false });
      setStatusMessage({ type: 'success', text: 'Homepage doc published successfully.' });
    } catch (error) {
      console.error("Save Error:", error);
      setStatusMessage({ type: 'error', text: 'Failed to publish homepage doc.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Documents', icon: FilePlus },
    { name: 'Homepage Docs', icon: FileText },
    { name: 'Notices & Circulars', icon: FileSearch },
    { name: 'Announcements', icon: Megaphone },
    { name: 'Service Requests', icon: ClipboardList },
    { name: 'Photo Gallery', icon: ImageIcon },
    { name: 'Hero Slider', icon: Images },
    { name: 'Forms', icon: ListOrdered },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
        {/* Profile */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-postal-red uppercase tracking-wider">Administrator</p>
            <p className="font-bold text-sm text-slate-800">{user?.displayName || 'Admin User'}</p>
          </div>
        </div>

        {/* Links */}
        <div className="py-6 px-4 flex-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                activeTab === tab.name 
                  ? 'bg-postal-red text-white shadow-md shadow-postal-red/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <tab.icon size={20} className={activeTab === tab.name ? 'text-white' : 'text-slate-400'} />
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <button 
            onClick={login}
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Connect to Drive
          </button>
          
          <button 
            onClick={logout}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-3 rounded-xl font-bold transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        {activeTab === 'Homepage Docs' ? (
          <div className="max-w-5xl mx-auto">
            {/* ... preserved Homepage Docs code ... */}
            <div className="mb-10">
              <h1 className="text-3xl font-black text-postal-dark-maroon uppercase mb-1">HOMEPAGE IMPORTANT DOCUMENTS</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Manage documents under the "Important Documents" bulletin board on the homepage
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
                <h2 className="text-sm font-bold text-postal-red uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                  Add New Document Item
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Document Title / Event Name</label>
                    <textarea 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. National Curriculum Framework for School Education 2023"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none resize-none h-24"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">External Link (Google Drive, YouTube, URL) *</label>
                    <input type="url" value={formData.pdfLink} onChange={(e) => setFormData({...formData, pdfLink: e.target.value})} placeholder="https://drive.google.com/..., https://youtube.com/..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Flipbook Link (Optional)</label>
                    <input type="url" value={formData.flipbookLink} onChange={(e) => setFormData({...formData, flipbookLink: e.target.value})} placeholder="https://example.com/flipbook" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none" />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer mt-4">
                    <input type="checkbox" checked={formData.isNew} onChange={(e) => setFormData({...formData, isNew: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-postal-red focus:ring-postal-red" />
                    <span className="text-xs font-bold text-slate-600 uppercase">Highlight with animated "NEW!" badge</span>
                  </label>
                  <button type="submit" disabled={loading} className="w-full bg-[#D62828] hover:bg-[#b01e1e] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg shadow-red-900/10">
                    <Plus size={20} /> Publish to Homepage
                  </button>
                </form>
              </div>

              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Homepage Items ({documents.length})</h2>
                <div className="space-y-4">
                  <AnimatePresence>
                    {documents.map((doc) => (
                      <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between gap-4 group">
                        <div>
                          <h3 className="font-bold text-slate-800 text-base mb-3 leading-snug">{doc.name}</h3>
                          <div className="flex items-center gap-3">
                            {doc.pdfLink && <a href={doc.pdfLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider hover:bg-blue-100 transition-colors">PDF: Link</a>}
                            {doc.isNew && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-md uppercase tracking-wider animate-pulse">NEW!</span>}
                          </div>
                        </div>
                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="Delete"><Trash2 size={20} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {documents.length === 0 && <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">No documents published yet.</div>}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Documents' ? (
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-postal-dark-maroon uppercase mb-1">DOCUMENT REPOSITORY</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Upload and manage documents across various portal categories. Documents will be uploaded to Google Drive.
              </p>
              {!getToken() && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3 text-orange-800">
                    <AlertCircle size={20} />
                    <span className="text-sm font-bold">Google Drive Authentication Required</span>
                  </div>
                  <button 
                    onClick={login}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              )}
            </div>

            {statusMessage && (
              <div className={`p-4 mb-6 rounded-xl text-sm font-bold flex items-center gap-2 ${
                statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {statusMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Form Panel */}
              <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
                <h2 className="text-sm font-bold text-postal-red uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                  Upload New Document
                </h2>
                <form onSubmit={handleDocSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type (Category) *</label>
                    <select
                      value={docFormData.type}
                      onChange={(e) => setDocFormData({...docFormData, type: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sub Type (Optional)</label>
                    <input 
                      type="text"
                      value={docFormData.subType}
                      onChange={(e) => setDocFormData({...docFormData, subType: e.target.value})}
                      placeholder="e.g. Previous Year Papers"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">File Name *</label>
                    <input 
                      type="text"
                      value={docFormData.fileName}
                      onChange={(e) => setDocFormData({...docFormData, fileName: e.target.value})}
                      placeholder="Official Document Title"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Description (Optional)</label>
                    <textarea 
                      value={docFormData.description}
                      onChange={(e) => setDocFormData({...docFormData, description: e.target.value})}
                      placeholder="Brief context about the file..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none resize-none h-24"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded-md transition-all ${uploadMode === 'file' ? 'bg-white shadow-sm text-postal-red' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Upload to Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('link')}
                        className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded-md transition-all ${uploadMode === 'link' ? 'bg-white shadow-sm text-postal-red' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        External Link
                      </button>
                    </div>

                    {uploadMode === 'file' ? (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upload File *</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                              <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-slate-400">PDF, XLS, DOC, PPT (MAX. 50MB)</p>
                            </div>
                            <input 
                              type="file" 
                              ref={fileInputRef}
                              className="hidden" 
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              required={uploadMode === 'file'}
                            />
                          </label>
                        </div>
                        {selectedFile && (
                          <p className="text-sm text-emerald-600 font-bold flex items-center gap-2 mt-2">
                            <CheckCircle2 size={16} /> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">External Link *</label>
                        <input 
                          type="url"
                          value={docFormData.externalLink}
                          onChange={(e) => setDocFormData({...docFormData, externalLink: e.target.value})}
                          placeholder="e.g. YouTube Video, Google Drive Share Link, etc."
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none"
                          required={uploadMode === 'link'}
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#D62828] hover:bg-[#b01e1e] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg shadow-red-900/10 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <UploadCloud size={20} /> Submit Document
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* List Panel */}
              <div className="lg:col-span-7">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Uploaded Documents ({portalDocs.length})</h2>
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {portalDocs.map((doc) => (
                      <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between gap-4 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">{doc.category}</span>
                            {doc.subType && <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-200 uppercase">{doc.subType}</span>}
                          </div>
                          <h3 className="font-bold text-slate-800 text-base mb-2 truncate" title={doc.name}>{doc.name}</h3>
                          <div className="flex items-center gap-3">
                            <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-postal-red hover:underline flex items-center gap-1">
                              <LinkIcon size={12} /> View File
                            </a>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {doc.createdAt?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="Delete"><Trash2 size={20} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {portalDocs.length === 0 && <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">No files uploaded yet.</div>}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Notices & Circulars' ? (
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-postal-dark-maroon uppercase mb-1">NOTICES & CIRCULARS</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Publish notices and circulars to the homepage bulletin board.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
                <h2 className="text-sm font-bold text-postal-red uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                  Add New Notice
                </h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  // Wrapper to set Category implicitly to "Notices & Circulars"
                  await handleDocSubmit(e, 'Notices & Circulars');
                }} className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Notice Sub-Category *</label>
                    <select
                      value={docFormData.subType || 'NOTICE'}
                      onChange={(e) => setDocFormData({...docFormData, subType: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none"
                    >
                      <option value="NOTICE">NOTICE</option>
                      <option value="ACCOMMODATION">ACCOMMODATION</option>
                      <option value="CGHS">CGHS</option>
                      <option value="PENSION/SALARY">PENSION/SALARY</option>
                      <option value="MISCELLANEOUS">MISCELLANEOUS</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Notice Title *</label>
                    <textarea 
                      value={docFormData.fileName}
                      onChange={(e) => setDocFormData({...docFormData, fileName: e.target.value})}
                      placeholder="Enter the notice title..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none resize-none h-24"
                      required
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer mt-4">
                    <input type="checkbox" checked={docFormData.isNew} onChange={(e) => setDocFormData({...docFormData, isNew: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-postal-red focus:ring-postal-red" />
                    <span className="text-xs font-bold text-slate-600 uppercase">Highlight with animated "NEW!" badge</span>
                  </label>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button type="button" onClick={() => setUploadMode('file')} className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded-md transition-all ${uploadMode === 'file' ? 'bg-white shadow-sm text-postal-red' : 'text-slate-500 hover:text-slate-700'}`}>Upload File</button>
                      <button type="button" onClick={() => setUploadMode('link')} className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded-md transition-all ${uploadMode === 'link' ? 'bg-white shadow-sm text-postal-red' : 'text-slate-500 hover:text-slate-700'}`}>External Link</button>
                    </div>

                    {uploadMode === 'file' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                              <p className="mb-2 text-sm text-slate-500">Click to upload or drag</p>
                            </div>
                            <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required={uploadMode === 'file'} />
                          </label>
                        </div>
                        {selectedFile && <p className="text-sm text-emerald-600 font-bold flex items-center gap-2 mt-2"><CheckCircle2 size={16} /> {selectedFile.name}</p>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input type="url" value={docFormData.externalLink} onChange={(e) => setDocFormData({...docFormData, externalLink: e.target.value})} placeholder="https://..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm" required={uploadMode === 'link'} />
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#D62828] hover:bg-[#b01e1e] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg disabled:opacity-50">
                    {loading ? 'Processing...' : <><Plus size={20} /> Publish Notice</>}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Published Notices ({portalDocs.filter(d => d.category === 'Notices & Circulars').length})</h2>
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {portalDocs.filter(d => d.category === 'Notices & Circulars').map((doc) => (
                      <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between gap-4 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-postal-blue bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">{doc.subType || 'NOTICE'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{doc.createdAt?.toDate().toLocaleDateString()}</span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-base mb-2">{doc.name}</h3>
                          <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-postal-red hover:underline flex items-center gap-1">
                            <LinkIcon size={12} /> View File/Link
                          </a>
                        </div>
                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="Delete"><Trash2 size={20} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {portalDocs.filter(d => d.category === 'Notices & Circulars').length === 0 && <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">No notices published yet.</div>}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Announcements' ? (
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-postal-dark-maroon uppercase mb-1">ANNOUNCEMENTS</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Publish announcements to the homepage.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
                <h2 className="text-sm font-bold text-postal-red uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                  Add New Announcement
                </h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!formData.title) return;
                  setLoading(true);
                  try {
                    await addDoc(collection(db, 'portal_documents'), {
                      category: 'Announcements',
                      name: formData.title,
                      link: formData.pdfLink,
                      createdBy: user?.uid,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp()
                    });
                    setFormData({ title: '', pdfLink: '', flipbookLink: '', isNew: false });
                    setStatusMessage({ type: 'success', text: 'Announcement published successfully.' });
                  } catch (error) {
                    console.error("Save Error:", error);
                    setStatusMessage({ type: 'error', text: 'Failed to publish announcement.' });
                  } finally {
                    setLoading(false);
                  }
                }} className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Announcement Text *</label>
                    <textarea 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Enter the announcement..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none resize-none h-24"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Link (Optional)</label>
                    <input type="url" value={formData.pdfLink} onChange={(e) => setFormData({...formData, pdfLink: e.target.value})} placeholder="https://..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none" />
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#D62828] hover:bg-[#b01e1e] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg disabled:opacity-50">
                    {loading ? 'Processing...' : <><Plus size={20} /> Publish Announcement</>}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Published Announcements ({portalDocs.filter(d => d.category === 'Announcements').length})</h2>
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {portalDocs.filter(d => d.category === 'Announcements').map((doc) => (
                      <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between gap-4 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-slate-400 font-medium">{doc.createdAt?.toDate().toLocaleDateString()}</span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm mb-2">{doc.name}</h3>
                          {doc.link && (
                            <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-postal-red hover:underline flex items-center gap-1">
                              <LinkIcon size={12} /> View Link
                            </a>
                          )}
                        </div>
                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="Delete"><Trash2 size={20} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {portalDocs.filter(d => d.category === 'Announcements').length === 0 && <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">No announcements published yet.</div>}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Hero Slider' ? (
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-postal-dark-maroon uppercase mb-1">HERO SLIDER</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Upload photos for the homepage Hero Slider.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
                <h2 className="text-sm font-bold text-postal-red uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                  Add New Slide
                </h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!formData.pdfLink) return;
                  setLoading(true);
                  try {
                    await addDoc(collection(db, 'portal_documents'), {
                      category: 'Hero Slider',
                      name: formData.title,
                      description: formData.description || '',
                      link: formData.pdfLink, // This will store the photo URL
                      createdBy: user?.uid,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp()
                    });
                    setFormData({ title: '', pdfLink: '', description: '', flipbookLink: '', isNew: false });
                    setStatusMessage({ type: 'success', text: 'Slide added successfully.' });
                  } catch (error) {
                    console.error("Save Error:", error);
                    setStatusMessage({ type: 'error', text: 'Failed to add slide.' });
                  } finally {
                    setLoading(false);
                  }
                }} className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Photo URL *</label>
                    <input type="url" value={formData.pdfLink} onChange={(e) => setFormData({...formData, pdfLink: e.target.value})} placeholder="https://..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none" required />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Title (Optional)</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Enter slide title..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subtitle (Optional)</label>
                    <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Enter slide subtitle..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none" />
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#D62828] hover:bg-[#b01e1e] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg disabled:opacity-50">
                    {loading ? 'Processing...' : <><Plus size={20} /> Add Slide</>}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Slides ({portalDocs.filter(d => d.category === 'Hero Slider').length})</h2>
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {portalDocs.filter(d => d.category === 'Hero Slider').map((doc) => (
                      <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between gap-4 group">
                        <div className="flex-1 min-w-0">
                          <img src={doc.link} alt="Slide Preview" className="w-32 h-20 object-cover rounded-lg mb-2" />
                          <h3 className="font-bold text-slate-800 text-sm mb-1">{doc.name || 'Untitled Slide'}</h3>
                          <p className="text-xs text-slate-500 mb-2">{doc.description}</p>
                          {doc.link && (
                            <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-postal-red hover:underline flex items-center gap-1">
                              <LinkIcon size={12} /> View Image
                            </a>
                          )}
                        </div>
                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="Delete"><Trash2 size={20} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {portalDocs.filter(d => d.category === 'Hero Slider').length === 0 && <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">No slides added yet.</div>}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Photo Gallery' ? (
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-postal-dark-maroon uppercase mb-1">PHOTO GALLERY</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Upload photos for the homepage Photo Gallery.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
                <h2 className="text-sm font-bold text-postal-red uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                  Add New Photo
                </h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!formData.pdfLink) return;
                  setLoading(true);
                  try {
                    await addDoc(collection(db, 'portal_documents'), {
                      category: 'Photo Gallery',
                      name: formData.title || '',
                      link: formData.pdfLink, // This will store the photo URL
                      createdBy: user?.uid,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp()
                    });
                    setFormData({ title: '', pdfLink: '', flipbookLink: '', isNew: false });
                    setStatusMessage({ type: 'success', text: 'Photo added successfully.' });
                  } catch (error) {
                    console.error("Save Error:", error);
                    setStatusMessage({ type: 'error', text: 'Failed to add photo.' });
                  } finally {
                    setLoading(false);
                  }
                }} className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Photo URL *</label>
                    <input type="url" value={formData.pdfLink} onChange={(e) => setFormData({...formData, pdfLink: e.target.value})} placeholder="https://..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none" required />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Caption (Optional)</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Enter photo caption..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red outline-none" />
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#D62828] hover:bg-[#b01e1e] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg disabled:opacity-50">
                    {loading ? 'Processing...' : <><Plus size={20} /> Add Photo</>}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Gallery Photos ({portalDocs.filter(d => d.category === 'Photo Gallery').length})</h2>
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {portalDocs.filter(d => d.category === 'Photo Gallery').map((doc) => (
                      <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between gap-4 group">
                        <div className="flex-1 min-w-0">
                          <img src={doc.link} alt="Gallery Preview" className="w-32 h-20 object-cover rounded-lg mb-2" />
                          {doc.name && <h3 className="font-bold text-slate-800 text-sm mb-1">{doc.name}</h3>}
                          {doc.link && (
                            <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-postal-red hover:underline flex items-center gap-1">
                              <LinkIcon size={12} /> View Image
                            </a>
                          )}
                        </div>
                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="Delete"><Trash2 size={20} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {portalDocs.filter(d => d.category === 'Photo Gallery').length === 0 && <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">No photos added yet.</div>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-sm">
            {activeTab} Management Panel Under Construction
          </div>
        )}
      </div>
    </div>
  );
}
