import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BookOpen, GraduationCap, Trophy, LayoutGrid, Newspaper, 
  Book, FileText, Calculator, MoreHorizontal, FileDown, 
  Search, ArrowLeft, Sparkles, Filter, CheckCircle2, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ExamCardItem {
  id: string;
  icon: any;
  title: string;
  desc: string;
  link: string;
  category: string;
  categoryName: string;
  badge: string;
  topics: string[];
}

const EXAM_CARDS: ExamCardItem[] = [
  { 
    id: "mts",
    icon: BookOpen, 
    title: "GDS TO MTS", 
    desc: "Study material for MTS recruitment examination", 
    link: "/portal/mts",
    category: "Cadre Exam",
    categoryName: "GDS TO MTS",
    badge: "MTS",
    topics: ["PO Guide Part I", "General Knowledge", "Basic Mathematics"]
  },
  { 
    id: "postman",
    icon: GraduationCap, 
    title: "POSTMAN EXAM", 
    desc: "Resources for Postman/Mail Guard departmental examination", 
    link: "/portal/postman",
    category: "Cadre Exam",
    categoryName: "POSTMAN EXAM",
    badge: "Postman",
    topics: ["Postal Manual Vol V", "PO Guide Part I", "Local Geography"]
  },
  { 
    id: "pa",
    icon: Trophy, 
    title: "PA/SA EXAM", 
    desc: "Postal Assistant & Sorting Assistant departmental and direct recruitment", 
    link: "/portal/pa",
    category: "Cadre Exam",
    categoryName: "PA/SA EXAM",
    badge: "PA / SA",
    topics: ["Postal Manual Vol VI & VII", "PO Guide Part I & II", "English & Reasoning"]
  },
  { 
    id: "lgo",
    icon: LayoutGrid, 
    title: "LGO EXAM", 
    desc: "Lower Grade Official promotion study material and guidelines", 
    link: "/portal/lgo",
    category: "Promotion Exam",
    categoryName: "LGO EXAM",
    badge: "LGO",
    topics: ["Departmental Rules", "Office Procedure", "Accounts"]
  },
  { 
    id: "inspector",
    icon: Newspaper, 
    title: "IP EXAM", 
    desc: "Inspector Posts preparation covering acts, volumes, and service rules", 
    link: "/portal/inspector",
    category: "Gazetted / IP",
    categoryName: "IP EXAM",
    badge: "IP Exam",
    topics: ["IPO Rules", "CCS Conduct Rules", "Postal Manuals"]
  },
  { 
    id: "po-guide",
    icon: Book, 
    title: "PO GUIDE", 
    desc: "Post Office Guide Part I & II with section breakdown and rules", 
    link: "/portal/po-guide",
    category: "Guide & Manual",
    categoryName: "PO GUIDE",
    badge: "PO Guide",
    topics: ["Part I: Inland Post", "Part II: Foreign Post", "General Rules"]
  },
  { 
    id: "manuals",
    icon: FileText, 
    title: "POSTAL MANUALS", 
    desc: "Volume V, VI, VII documentation, departmental orders and circulars", 
    link: "/portal/manuals",
    category: "Guide & Manual",
    categoryName: "POSTAL MANUALS",
    badge: "Manuals",
    topics: ["Manual Vol V", "Manual Vol VI", "Manual Vol VII"]
  },
  { 
    id: "accountant",
    icon: Calculator, 
    title: "ACCOUNTANT EXAM", 
    desc: "PO & RMS Accountant exam resources, cash book and accounts codes", 
    link: "/portal/accountant",
    category: "Specialized",
    categoryName: "ACCOUNTANT EXAM",
    badge: "Accountant",
    topics: ["Postal Accounts Vol I & II", "Cash Operations", "Financial Rules"]
  },
  { 
    id: "others",
    icon: MoreHorizontal, 
    title: "OTHERS", 
    desc: "General departmental guidelines, notifications, and reference files", 
    link: "/portal/others",
    category: "Forms & Misc",
    categoryName: "OTHERS",
    badge: "Misc",
    topics: ["General Guidelines", "Orders & Circulars", "Reference Notes"]
  },
  { 
    id: "forms",
    icon: FileDown, 
    title: "FORMS", 
    desc: "Download all postal forms in PDF format with quick share options", 
    link: "/portal/forms",
    category: "Forms & Misc",
    categoryName: "Forms",
    badge: "Forms",
    topics: ["Savings Bank Forms", "Claim Forms", "Service Applications"]
  },
];

const CARD_COLORS = [
  { bg: 'bg-[#d63435]', dark: 'bg-[#b82d2e]', shadow: 'shadow-[#d63435]/25' }, // Red
  { bg: 'bg-[#218c75]', dark: 'bg-[#1b7360]', shadow: 'shadow-[#218c75]/25' }, // Teal
  { bg: 'bg-[#e29339]', dark: 'bg-[#c27c2e]', shadow: 'shadow-[#e29339]/25' }, // Amber / Orange
  { bg: 'bg-[#2979b9]', dark: 'bg-[#216398]', shadow: 'shadow-[#2979b9]/25' }, // Blue
  { bg: 'bg-[#9853b4]', dark: 'bg-[#7c4493]', shadow: 'shadow-[#9853b4]/25' }, // Purple
  { bg: 'bg-[#4359a8]', dark: 'bg-[#37498c]', shadow: 'shadow-[#4359a8]/25' }, // Indigo
  { bg: 'bg-[#3c4651]', dark: 'bg-[#2f3740]', shadow: 'shadow-[#3c4651]/25' }, // Slate
  { bg: 'bg-[#d7742b]', dark: 'bg-[#b86121]', shadow: 'shadow-[#d7742b]/25' }, // Warm Orange
  { bg: 'bg-[#00897b]', dark: 'bg-[#00695c]', shadow: 'shadow-[#00897b]/25' }, // Emerald
  { bg: 'bg-[#8e24aa]', dark: 'bg-[#6a1b9a]', shadow: 'shadow-[#8e24aa]/25' }, // Fuchsia
];

export function ExamPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const q = query(collection(db, 'portal_documents'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const cat = doc.data().category;
        if (cat) counts[cat] = (counts[cat] || 0) + 1;
      });
      setDocCounts(counts);
    }, (error) => {
      console.warn("Could not load document counts", error);
    });
    return () => unsubscribe();
  }, []);

  const categories = ['ALL', 'Cadre Exam', 'Promotion Exam', 'Gazetted / IP', 'Guide & Manual', 'Forms & Misc'];

  const filteredCards = EXAM_CARDS.filter((card) => {
    const matchesSearch = 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || card.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-[#5b1e25] via-[#801824] to-[#a81c2b] text-white py-12 md:py-16 shadow-md relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute left-1/3 -bottom-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-postal-yellow hover:underline tracking-wider uppercase"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-postal-yellow text-[11px] font-black uppercase tracking-widest mb-3 backdrop-blur-sm border border-white/10">
              <Sparkles size={14} /> Department of Posts • Postal Knowledge Portal
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
              Postal Exam Portal
            </h1>
            <p className="text-sm md:text-base text-white/85 leading-relaxed font-medium">
              Explore comprehensive study materials, question papers, syllabus guides, and reference manuals for all Departmental Examinations — GDS to MTS, Postman, PA/SA, IP Exam, LGO, and PO Accountant.
            </p>
          </div>

          {/* Search Bar inside Header */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by exam name or syllabus topic (e.g. MTS, Postman, PA/SA, PO Guide)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-20 py-3.5 bg-white text-slate-800 rounded-2xl shadow-xl border border-white/20 focus:outline-none focus:ring-4 focus:ring-postal-yellow/30 text-sm font-medium placeholder:text-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Content Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-2 shrink-0">
            <Filter size={14} /> Filter:
          </span>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm",
                selectedCategory === category
                  ? "bg-postal-red text-white shadow-postal-red/25"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing <span className="text-postal-red font-black">{filteredCards.length}</span> portal categories
          </p>
        </div>

        {/* Exam Cards Grid in Signature Two-Tone Block Card Style */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((item, i) => {
              const color = CARD_COLORS[i % CARD_COLORS.length];
              const count = docCounts[item.categoryName];

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <Link
                    to={item.link}
                    className={cn(
                      "flex items-stretch overflow-hidden rounded-xl shadow-md transition-all h-32 sm:h-36 group relative text-left w-full",
                      color.bg,
                      color.shadow
                    )}
                  >
                    {/* Left Icon Section with Darker Shade */}
                    <div className={cn("w-24 sm:w-28 flex items-center justify-center shrink-0 border-r border-white/10", color.dark)}>
                      <div className="bg-white/95 p-3.5 sm:p-4 rounded-full shadow-lg text-slate-700 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                        <item.icon size={28} className="shrink-0" />
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center min-w-0 pr-12 lg:pr-14">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-2.5 py-0.5 rounded text-white border border-white/10 shadow-sm inline-block">
                          {item.badge}
                        </span>
                        {count !== undefined && count > 0 && (
                          <span className="text-[9px] font-bold text-white/80 bg-black/20 px-2 py-0.5 rounded backdrop-blur-sm">
                            {count} {count === 1 ? 'file' : 'files'}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-white font-black text-base sm:text-lg lg:text-xl tracking-tight leading-snug group-hover:underline decoration-white/40 underline-offset-4 line-clamp-1">
                        {item.title}
                      </h3>
                      
                      {item.desc && (
                        <p className="text-white/85 text-[11px] sm:text-xs leading-snug mt-1 line-clamp-2 font-medium opacity-90">
                          {item.desc}
                        </p>
                      )}
                    </div>

                    {/* Floating Right Chevron */}
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
                      <ChevronRight size={22} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No exam material found</h3>
            <p className="text-xs text-slate-500 mb-6">
              No categories match your search query "{searchQuery}". Try searching for another keyword or clear filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="px-6 py-2.5 bg-postal-red text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Informational Syllabus & Guidance Section */}
        <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
          <div className="max-w-3xl mb-8">
            <span className="text-[11px] font-bold text-postal-red uppercase tracking-widest">Guidance & Overview</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-1">
              About Postal Departmental Examinations
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              DakShiksha provides structured, syllabus-aligned preparation resources for Department of Posts promotions and competitive exams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <h4 className="font-bold text-slate-800 text-sm">GDS to MTS / Postman</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Covers Post Office Guide Part I, organization of department, type of post offices, delivery rules, and postal math.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 size={20} className="text-blue-600 shrink-0" />
                <h4 className="font-bold text-slate-800 text-sm">PA / SA & LGO</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extensive coverage of Postal Manuals Vol VI (Part I, II, III), Vol VII, PO Guide Part II (Foreign Post), and Office Procedure.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 size={20} className="text-purple-600 shrink-0" />
                <h4 className="font-bold text-slate-800 text-sm">Inspector Posts (IP)</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comprehensive study for Paper I, II, III, and IV covering IPC/CrPC, IPO Rules, CCS Leave & Conduct Rules, and RTI Act.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
