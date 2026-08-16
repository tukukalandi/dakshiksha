import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, ExternalLink, ChevronRight, 
  ArrowLeft, Search, Filter, BookOpen,
  Download, Clock, Tag, LayoutPanelLeft,
  FileBadge, FileJson, FileType, Youtube, Link as LinkIcon, MessageSquare, FileText, MessageCircle, Check
} from 'lucide-react';
import { cn } from '../lib/utils';

// Helper to determine file type from URL
function getFileTypeInfo(url: string) {
  const extension = url.split(/[#?]/)[0].split('.').pop()?.toLowerCase();
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YOUTUBE VIDEO', color: 'text-red-500', bgColor: 'bg-red-50', icon: Youtube };
  if (extension === 'pdf') return { label: 'PDF DOCUMENT', color: 'text-red-600', bgColor: 'bg-red-50', icon: FileText };
  if (['doc', 'docx'].includes(extension || '')) return { label: 'WORD DOC', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: FileText };
  if (['xls', 'xlsx', 'csv'].includes(extension || '')) return { label: 'SPREADSHEET', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: FileText };
  if (url.includes('drive.google.com')) return { label: 'GOOGLE DRIVE', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: FileText };
  
  return { label: 'EXTERNAL LINK', color: 'text-postal-red', bgColor: 'bg-postal-red/5', icon: LinkIcon };
}

interface PortalDoc {
  id: string;
  category: string;
  subType: string;
  name: string;
  description: string;
  link: string;
  createdAt: any;
}

const CATEGORY_MAP: Record<string, string> = {
  'mts': 'GDS TO MTS',
  'postman': 'POSTMAN EXAM',
  'pa': 'PA/SA EXAM',
  'lgo': 'LGO EXAM',
  'inspector': 'IP EXAM',
  'po-guide': 'PO GUIDE',
  'manuals': 'POSTAL MANUALS',
  'accountant': 'ACCOUNTANT EXAM',
  'others': 'OTHERS',
  'employee-site': 'Employee Site',
  'forms': 'Forms'
};

const CARD_COLORS = [
  { bg: 'bg-[#e53935]', dark: 'bg-[#c62828]', shadow: 'shadow-red-500/20' }, // Red
  { bg: 'bg-[#00897b]', dark: 'bg-[#00695c]', shadow: 'shadow-teal-500/20' }, // Teal
  { bg: 'bg-[#5e35b1]', dark: 'bg-[#4527a0]', shadow: 'shadow-purple-500/20' }, // Purple
  { bg: 'bg-[#1e88e5]', dark: 'bg-[#1565c0]', shadow: 'shadow-blue-500/20' }, // Blue
  { bg: 'bg-[#fb8c00]', dark: 'bg-[#ef6c00]', shadow: 'shadow-orange-500/20' }, // Orange
  { bg: 'bg-[#d8a100]', dark: 'bg-[#b78a00]', shadow: 'shadow-amber-500/20' }, // Amber
  { bg: 'bg-[#43a047]', dark: 'bg-[#2e7d32]', shadow: 'shadow-green-500/20' }, // Green
  { bg: 'bg-[#8e24aa]', dark: 'bg-[#6a1b9a]', shadow: 'shadow-fuchsia-500/20' }, // Deep Purple
];

const PILL_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-blue-100 text-blue-700',
  'bg-red-100 text-red-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700'
];

const CopyLinkButton = ({ link }: { link: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy Link"
      className="flex items-center justify-center w-10 h-10 bg-blue-100/80 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors shrink-0"
    >
      {copied ? <Check size={18} /> : <LinkIcon size={18} />}
    </button>
  );
};

export function PublicPortal() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [documents, setDocuments] = useState<PortalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubType, setSelectedSubType] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  const categoryName = CATEGORY_MAP[categorySlug || ''] || categorySlug;

  useEffect(() => {
    if (!categoryName) return;

    const q = query(
      collection(db, 'portal_documents'),
      where('category', '==', categoryName),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PortalDoc[];
      setDocuments(docs);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'portal_documents'));

    return () => unsubscribe();
  }, [categoryName]);

  const allSubTypes = Array.from(new Set(documents.map(doc => doc.subType))).filter(Boolean).sort();

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory ? doc.subType === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.subType]) {
      acc[doc.subType] = [];
    }
    acc[doc.subType].push(doc);
    return acc;
  }, {} as Record<string, PortalDoc[]>);

  const subTypes = Object.keys(groupedDocs).sort();

  const isDirectView = categoryName === 'Employee Site' || categoryName === 'Forms' || (subTypes.length === 1 && subTypes[0] === '');
  const activeSubType = isDirectView ? (subTypes[0] || '') : selectedSubType;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-postal-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            {(!isDirectView && activeSubType !== null) ? (
              <button 
                onClick={() => setSelectedSubType(null)}
                className="inline-flex items-center text-sm transition-colors group text-postal-red font-bold hover:underline"
              >
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Sub-Types
              </button>
            ) : (
              <Link 
                to="/"
                className="inline-flex items-center text-sm transition-colors group text-slate-500 hover:text-postal-red"
              >
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Link>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-postal-red/10 text-postal-red text-xs font-bold rounded-full uppercase tracking-wider">
                  {activeSubType !== null ? "Documents" : "Resource Portal"}
                </span>
              </div>
              <h1 className="text-4xl font-display font-bold text-slate-900 leading-tight">
                {isDirectView ? categoryName : (activeSubType !== null ? (activeSubType || categoryName) : categoryName)}
              </h1>
              {activeSubType === null && (
                <p className="text-slate-600 mt-2 max-w-2xl">
                  Select a category below to explore curated study materials for the {categoryName}.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
              {categoryName === 'Forms' && allSubTypes.length > 0 && (
                <div className="relative w-full sm:w-48">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {allSubTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              )}
              <div className="relative w-full md:w-80 search-container">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder={activeSubType !== null ? "Search documents..." : "Search categories..."}
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-postal-red/20 focus:border-postal-red transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {subTypes.length > 0 ? (
          <AnimatePresence mode="wait">
            {activeSubType === null ? (
              // Sub-Type Cards Grid
              <motion.div 
                key="subtypes"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {subTypes.map((subType, i) => {
                  const color = CARD_COLORS[i % CARD_COLORS.length];
                  return (
                    <motion.div
                      key={subType}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSubType(subType)}
                      className={cn(
                        "flex items-stretch overflow-hidden rounded-lg shadow-md transition-all cursor-pointer h-32 group",
                        color.bg,
                        color.shadow
                      )}
                    >
                      <div className={cn("w-24 flex items-center justify-center shrink-0 border-r border-white/10", color.dark)}>
                        <div className="bg-white/95 p-4 rounded-full shadow-inner text-slate-700">
                          <LayoutPanelLeft size={28} />
                        </div>
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
                        <h3 className="text-white font-black text-lg tracking-tight break-words leading-tight group-hover:underline decoration-white/30 underline-offset-2">
                          {subType ? subType : 'General Documents'}
                        </h3>
                        <p className="text-white/70 text-xs font-bold uppercase tracking-[0.15em] mt-2 opacity-90">
                          {groupedDocs[subType].length} Items in Category
                        </p>
                      </div>
                      <div className="px-3 flex items-center text-white/40 group-hover:text-white transition-colors">
                        <ChevronRight size={16} />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              // Documents List for Selected Sub-Type
               <motion.div 
                key="documents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={categoryName === 'Forms' ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}
              >
                {(isDirectView ? filteredDocs : groupedDocs[activeSubType as string])?.map((doc, i) => {
                  const typeInfo = getFileTypeInfo(doc.link);
                  const color = CARD_COLORS[i % CARD_COLORS.length];
                  
                  if (categoryName === 'Forms') {
                    const pillColorClass = PILL_COLORS[i % PILL_COLORS.length];

                    return (
                      <div key={doc.id} className="flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow">
                        {/* Left Category Block */}
                        <div className="bg-[#5b1e25] text-white w-full sm:w-32 flex flex-col items-center justify-center py-4 sm:py-6 shrink-0 px-2 text-center">
                          <span className="text-xs sm:text-sm font-black uppercase tracking-widest break-words line-clamp-3">
                            {doc.subType || 'GENERAL'}
                          </span>
                        </div>
                        
                        {/* Middle Content Block */}
                        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center min-w-0">
                          <div className="mb-3">
                            <span className={cn("text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full inline-block", pillColorClass)}>
                              {doc.subType || 'GENERAL'}
                            </span>
                          </div>
                          <h3 className="text-slate-800 font-bold text-base sm:text-[17px] leading-snug break-words">
                            {doc.name}
                          </h3>
                        </div>

                        {/* Right Actions Block */}
                        <div className="flex items-center gap-3 p-4 sm:p-6 shrink-0 bg-slate-50/50 sm:bg-transparent border-t sm:border-t-0 border-slate-100 sm:border-l">
                          <a
                            href={doc.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-rose-100/80 text-rose-700 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-rose-200 transition-colors whitespace-nowrap"
                          >
                            <FileText size={16} /> <span className="hidden xs:inline">View PDF</span><span className="xs:hidden">PDF</span>
                          </a>
                          <a
                             href={`https://wa.me/?text=${encodeURIComponent(doc.name + ' - ' + doc.link)}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             title="Share via WhatsApp"
                             className="flex items-center justify-center w-10 h-10 bg-emerald-100/80 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors shrink-0"
                          >
                             <MessageCircle size={18} />
                          </a>
                          <CopyLinkButton link={doc.link} />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <motion.a
                      key={doc.id}
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex items-stretch overflow-hidden rounded-lg shadow-md transition-all cursor-pointer h-32 group relative",
                        color.bg,
                        color.shadow
                      )}
                    >
                      {/* Left Icon Section */}
                      <div className={cn("w-24 sm:w-28 flex items-center justify-center shrink-0 border-r border-white/10", color.dark)}>
                        <div className="bg-white/95 p-4 rounded-full shadow-lg text-slate-700 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                          <typeInfo.icon size={28} />
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-5 flex flex-col justify-center min-w-0 pr-12 lg:pr-16">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-2.5 py-1 rounded text-white border border-white/10 shadow-sm">
                            {typeInfo.label}
                          </span>
                        </div>
                        <h3 className="text-white font-black text-base sm:text-lg lg:text-xl tracking-tight leading-tight group-hover:underline decoration-white/40 underline-offset-4">
                          {doc.name}
                        </h3>
                        {doc.description && (
                          <p className="text-white/80 text-[11px] leading-snug mt-2 line-clamp-2 italic font-medium opacity-90">
                            {doc.description}
                          </p>
                        )}
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
                           {doc.createdAt?.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                         </div>
                         <Download size={14} className="text-white/80 group-hover:scale-125 transition-transform" />
                      </div>
                    </motion.a>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="inline-flex p-6 bg-slate-50 rounded-full text-slate-300 mb-4">
              <Search size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No resources found</h3>
            <p className="text-slate-500 mt-2">
              {searchQuery ? 'Try adjusting your search query' : `We haven't uploaded any documents for ${categoryName} yet.`}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 px-6 py-2 bg-postal-red text-white rounded-full font-bold text-sm hover:bg-postal-red/90 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
