import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { 
  ArrowRight, GraduationCap, Bell, FileText, Search,
  Calculator, Landmark, ShieldCheck, Fingerprint, Map, 
  Smartphone, PiggyBank, HelpCircle, FileStack, Percent, UserCircle,
  ScrollText, ArrowUpRight
} from 'lucide-react';

const SLIDES = [
  {
    image: "https://picsum.photos/seed/logistics/1920/600",
    title: "Global Postal Logistics",
    subtitle: "Seamless connectivity across the world with India Post.",
    color: "from-postal-red/60 to-transparent"
  },
  {
    image: "https://picsum.photos/seed/delivery/1920/600",
    title: "Speed Post 24",
    subtitle: "Guaranteed next-day delivery for your important parcels and documents.",
    color: "from-postal-red/60 to-transparent"
  },
  {
    image: "https://picsum.photos/seed/education/1920/600",
    title: "Pariksha Pe Charcha 2026",
    subtitle: "Join the conversation with Hon'ble PM Narendra Modi.",
    color: "from-blue-600/60 to-transparent"
  },
  {
    image: "https://picsum.photos/seed/stamps/1920/600",
    title: "World of Stamps",
    subtitle: "Explore the rich heritage of Indian Philately from 1854 to today.",
    color: "from-amber-600/60 to-transparent"
  },
  {
    image: "https://picsum.photos/seed/postal1/1920/600",
    title: "Excellence in Postal Departmental Exams",
    subtitle: "Comprehensive study material for GDS to MTS, Postman, and PA/SA exams.",
    color: "from-postal-red/80 to-transparent"
  },
  {
    image: "https://picsum.photos/seed/postal2/1920/600",
    title: "Master the Postal Knowledge",
    subtitle: "Detailed guides on Post Office Guide Part I, II, and Postal Manuals.",
    color: "from-blue-900/80 to-transparent"
  },
  {
    image: "https://picsum.photos/seed/postal3/1920/600",
    title: "Interactive Mock Tests",
    subtitle: "Evaluate your preparation with our specialized postal exam quizzes.",
    color: "from-emerald-900/80 to-transparent"
  }
];

const SERVICES = [
  { 
    title: "Forms", 
    icon: FileText, 
    normalIcon: "text-blue-600 bg-blue-50 border-blue-200", 
    topAccent: "bg-blue-600",
    hoverBg: "group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-700",
    hoverShadow: "group-hover:shadow-blue-500/35",
    link: "https://indiapost-repository.vercel.app/" 
  },
  { 
    title: "Circulars", 
    icon: ScrollText, 
    normalIcon: "text-rose-600 bg-rose-50 border-rose-200", 
    topAccent: "bg-rose-600",
    hoverBg: "group-hover:bg-gradient-to-br group-hover:from-rose-600 group-hover:to-red-700",
    hoverShadow: "group-hover:shadow-rose-500/35",
    link: "https://circulars.vercel.app/" 
  },
  { 
    title: "Track Consignment", 
    icon: Search, 
    normalIcon: "text-emerald-600 bg-emerald-50 border-emerald-200", 
    topAccent: "bg-emerald-600",
    hoverBg: "group-hover:bg-gradient-to-br group-hover:from-emerald-600 group-hover:to-teal-700",
    hoverShadow: "group-hover:shadow-emerald-500/35",
    link: "https://www.indiapost.gov.in/" 
  },
  { 
    title: "Internet Banking", 
    icon: Landmark, 
    normalIcon: "text-amber-600 bg-amber-50 border-amber-200", 
    topAccent: "bg-amber-500",
    hoverBg: "group-hover:bg-gradient-to-br group-hover:from-amber-500 group-hover:to-orange-600",
    hoverShadow: "group-hover:shadow-amber-500/35",
    link: "https://ebanking.indiapost.gov.in/corp/AuthenticationController?FORMSGROUP_ID__=AuthenticationFG&__START_TRAN_FLAG__=Y&__FG_BUTTONS__=LOAD&ACTION.LOAD=Y&AuthenticationFG.LOGIN_FLAG=1&BANK_ID=DOP" 
  },
  { 
    title: "PLI / RPLI", 
    icon: ShieldCheck, 
    normalIcon: "text-sky-600 bg-sky-50 border-sky-200", 
    topAccent: "bg-sky-600",
    hoverBg: "group-hover:bg-gradient-to-br group-hover:from-sky-600 group-hover:to-blue-700",
    hoverShadow: "group-hover:shadow-sky-500/35",
    link: "https://pli.indiapost.gov.in/" 
  },
  { 
    title: "Postage Calculator", 
    icon: Calculator, 
    normalIcon: "text-orange-500 bg-orange-50 border-orange-200", 
    topAccent: "bg-orange-500",
    hoverBg: "group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-red-600",
    hoverShadow: "group-hover:shadow-orange-500/35",
    link: "https://www.indiapost.gov.in/calculate-postage" 
  },
  { 
    title: "Aadhaar Services", 
    icon: Fingerprint, 
    normalIcon: "text-indigo-600 bg-indigo-50 border-indigo-200", 
    topAccent: "bg-indigo-600",
    hoverBg: "group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-purple-700",
    hoverShadow: "group-hover:shadow-indigo-500/35",
    link: "https://uidai.gov.in/en/" 
  },
  { 
    title: "DIGIPIN", 
    icon: Map, 
    normalIcon: "text-pink-600 bg-pink-50 border-pink-200", 
    topAccent: "bg-pink-600",
    hoverBg: "group-hover:bg-gradient-to-br hover:from-pink-600 hover:to-rose-700",
    hoverShadow: "group-hover:shadow-pink-500/35",
    link: "https://dac.indiapost.gov.in/mydigipin/home" 
  },
  { 
    title: "IPPB Service", 
    icon: Smartphone, 
    normalIcon: "text-cyan-600 bg-cyan-50 border-cyan-200", 
    topAccent: "bg-cyan-600",
    hoverBg: "group-hover:bg-gradient-to-br hover:from-cyan-600 hover:to-blue-600",
    hoverShadow: "group-hover:shadow-cyan-500/35",
    link: "https://ippbonline.bank.in/en/web/ippb" 
  },
  { 
    title: "Post Office Savings Scheme", 
    icon: PiggyBank, 
    normalIcon: "text-teal-600 bg-teal-50 border-teal-200", 
    topAccent: "bg-teal-600",
    hoverBg: "group-hover:bg-gradient-to-br hover:from-teal-600 hover:to-emerald-700",
    hoverShadow: "group-hover:shadow-teal-500/35",
    link: "https://www.indiapost.gov.in/banking-services/savings" 
  },
  { 
    title: "Finacle Assistant", 
    icon: HelpCircle, 
    normalIcon: "text-violet-600 bg-violet-50 border-violet-200", 
    topAccent: "bg-violet-600",
    hoverBg: "group-hover:bg-gradient-to-br hover:from-violet-600 hover:to-purple-800",
    hoverShadow: "group-hover:shadow-violet-500/35",
    link: "https://finacle-user-guide.vercel.app/" 
  },
  { 
    title: "Multi Receipt Converter", 
    icon: FileStack, 
    normalIcon: "text-purple-600 bg-purple-50 border-purple-200", 
    topAccent: "bg-purple-600",
    hoverBg: "group-hover:bg-gradient-to-br hover:from-purple-600 hover:to-fuchsia-700",
    hoverShadow: "group-hover:shadow-purple-500/35",
    link: "https://multi-receipt.vercel.app/" 
  },
  { 
    title: "Interest Rates", 
    icon: Percent, 
    normalIcon: "text-amber-600 bg-amber-50 border-amber-200", 
    topAccent: "bg-amber-600",
    hoverBg: "group-hover:bg-gradient-to-br hover:from-amber-600 hover:to-orange-700",
    hoverShadow: "group-hover:shadow-amber-500/35",
    link: "https://interest-rates-nine.vercel.app/" 
  },
  { 
    title: "Customer Login", 
    icon: UserCircle, 
    normalIcon: "text-blue-700 bg-blue-50 border-blue-200", 
    topAccent: "bg-blue-700",
    hoverBg: "group-hover:bg-gradient-to-br hover:from-blue-700 hover:to-indigo-900",
    hoverShadow: "group-hover:shadow-blue-700/35",
    link: "https://app.indiapost.gov.in/customer-selfservice/login" 
  },
  { 
    title: "Tariff Calculator", 
    icon: Calculator, 
    normalIcon: "text-red-600 bg-red-50 border-red-200", 
    topAccent: "bg-red-600",
    hoverBg: "group-hover:bg-gradient-to-br hover:from-red-600 hover:to-rose-800",
    hoverShadow: "group-hover:shadow-red-600/35",
    link: "https://tariff-calculator-nu.vercel.app/" 
  },
];

export function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [homepageDocs, setHomepageDocs] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [activeNoticeTab, setActiveNoticeTab] = useState('NOTICE');
  const navigate = useNavigate();

  useEffect(() => {
    // We will handle slide transition in a separate effect if needed, or update here
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const slidesLength = heroSlides.length > 0 ? heroSlides.length : SLIDES.length;
        return (prev + 1) % slidesLength;
      });
    }, 5000);

    const q = query(
      collection(db, 'portal_documents'), 
      where('category', '==', 'Homepage Docs'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHomepageDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qNotices = query(
      collection(db, 'portal_documents'),
      where('category', '==', 'Notices & Circulars')
    );
    const unsubscribeNotices = onSnapshot(qNotices, (snapshot) => {
      const sortedDocs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setNotices(sortedDocs);
    });

    const qAnnouncements = query(
      collection(db, 'portal_documents'),
      where('category', '==', 'Announcements')
    );
    const unsubscribeAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      const sortedDocs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setAnnouncements(sortedDocs);
    });

    const qHero = query(
      collection(db, 'portal_documents'),
      where('category', '==', 'Hero Slider')
    );
    const unsubscribeHero = onSnapshot(qHero, (snapshot) => {
      const sortedDocs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setHeroSlides(sortedDocs);
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
      unsubscribeNotices();
      unsubscribeAnnouncements();
      unsubscribeHero();
    };
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Hero Slider Section */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img 
              src={(heroSlides.length > 0 ? heroSlides : SLIDES)[currentSlide]?.link || (heroSlides.length > 0 ? heroSlides : SLIDES)[currentSlide]?.image} 
              className="w-full h-full object-cover"
              alt="Hero"
              referrerPolicy="no-referrer"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${(heroSlides.length > 0 ? heroSlides : SLIDES)[currentSlide]?.color || 'from-postal-red/60 to-transparent'} flex items-center`}>
              <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="max-w-2xl text-white"
                >
                  <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                    {(heroSlides.length > 0 ? heroSlides : SLIDES)[currentSlide]?.name || (heroSlides.length > 0 ? heroSlides : SLIDES)[currentSlide]?.title}
                  </h1>
                  <p className="text-lg md:text-xl opacity-90 mb-8">
                    {(heroSlides.length > 0 ? heroSlides : SLIDES)[currentSlide]?.description || (heroSlides.length > 0 ? heroSlides : SLIDES)[currentSlide]?.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => navigate('/exam-portal')} 
                      className="bg-postal-yellow text-slate-900 px-8 py-3 rounded-sm font-bold hover:bg-white transition-colors"
                    >
                      Exam Portal
                    </button>
                    <button 
                      onClick={() => navigate('/portal/forms')} 
                      className="border-2 border-white text-white px-8 py-3 rounded-sm font-bold hover:bg-white/10 transition-colors"
                    >
                      Download Forms
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Slider Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {(heroSlides.length > 0 ? heroSlides : SLIDES).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-8 bg-postal-yellow' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Exam Portal Gateway Banner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-12">
        <div className="bg-gradient-to-r from-[#5b1e25] via-[#801824] to-[#a81c2b] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-postal-yellow border border-white/20 shadow-inner">
              <GraduationCap size={36} />
            </div>
            <div>
              <div className="inline-block px-3 py-0.5 rounded-full bg-postal-yellow/20 text-postal-yellow text-[10px] font-black uppercase tracking-widest mb-1.5 border border-postal-yellow/30">
                Departmental Exams
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Postal Exam Portal
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl mt-1">
                Access complete study materials, question banks, and syllabus guides for GDS to MTS, Postman, PA/SA, IP, LGO, and PO Accountant exams.
              </p>
            </div>
          </div>
          <Link
            to="/exam-portal"
            className="w-full md:w-auto px-6 py-3.5 bg-postal-yellow text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 group"
          >
            <span>Open Exam Portal</span>
            <ArrowRight size={16} className="transform transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>



      {/* Quick Links Section */}
      <div className="bg-slate-50 py-20 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-postal-yellow text-slate-900 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm">
              Quick Links
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Quick links section</h2>
            <p className="text-slate-500">Important Web Portals</p>
            <div className="w-20 h-1 bg-postal-yellow mx-auto mt-6 rounded-full" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {SERVICES.map((service, i) => {
              const CardContent = (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col items-center text-center group cursor-pointer transition-all duration-300 h-full min-h-[160px] justify-between",
                    service.hoverBg,
                    service.hoverShadow,
                    "hover:border-transparent hover:shadow-xl"
                  )}
                >
                  {/* Top Color Accent Bar */}
                  <div className={cn("absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 group-hover:h-0", service.topAccent)} />

                  {/* Radial Glow Aura on Hover */}
                  <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Top-Right Mini Link Arrow */}
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-100/90 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-white/20 transition-all duration-300 -translate-y-1 group-hover:translate-y-0 text-slate-500 group-hover:text-white shadow-xs">
                    <ArrowUpRight size={13} className="stroke-[2.5]" />
                  </div>

                  {/* Icon Badge */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl border flex items-center justify-center mb-3.5 transition-all duration-300 shadow-xs",
                    service.normalIcon,
                    "group-hover:bg-white/20 group-hover:border-white/30 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md"
                  )}>
                    <service.icon size={26} className="transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  {/* Bold Card Title */}
                  <div className="w-full flex-1 flex flex-col justify-center">
                    <h3 className="text-sm sm:text-[15px] font-black text-slate-900 group-hover:text-white transition-colors duration-300 tracking-tight leading-snug px-1">
                      {service.title}
                    </h3>
                  </div>

                  {/* Bottom Indicator */}
                  <div className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white/90 transition-colors duration-300 flex items-center gap-1 opacity-70 group-hover:opacity-100">
                    <span>Quick Access</span>
                  </div>
                </motion.div>
              );

              if (service.link) {
                return (
                  <a 
                    key={service.title} 
                    href={service.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block h-full group"
                  >
                    {CardContent}
                  </a>
                );
              }

              return (
                <div key={service.title} className="block h-full">
                  {CardContent}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        
        {/* News & Announcements */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between border-b-2 border-postal-red pb-2 mb-4">
              <h2 className="text-xl font-bold text-postal-red flex items-center gap-2">
                <Bell size={20} /> Announcements
              </h2>
              <button className="text-xs font-bold text-slate-400 hover:text-postal-red uppercase tracking-wider">View All</button>
            </div>
            <div className="space-y-4">
              {announcements.length > 0 ? announcements.map((ann, i) => (
                <div key={ann.id || i} className="flex gap-3 group cursor-pointer" onClick={() => ann.link && window.open(ann.link, '_blank')}>
                  <div className="min-w-[4px] bg-postal-red/20 rounded-full group-hover:bg-postal-red transition-colors" />
                  <p className="text-sm text-slate-600 group-hover:text-postal-red transition-colors">{ann.name}</p>
                </div>
              )) : (
                <div className="text-sm text-slate-400 font-medium">No new announcements.</div>
              )}
            </div>
          </div>
        </div>

        {/* Bulletin Boards */}
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            
            {/* Left: Important Documents */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
              <div className="bg-[#2a4392] text-white p-5 flex items-center gap-3 shrink-0">
                <FileText size={20} />
                <h2 className="text-lg font-black tracking-wide uppercase">Important Documents</h2>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <ul className="space-y-6">
                  {homepageDocs.map((doc, idx) => {
                    const url = (doc.link || "").toLowerCase();
                    let ftype = "LINK";
                    if (url.includes('.pdf')) ftype = "PDF";
                    else if (url.includes('.doc')) ftype = "DOC";
                    else if (url.includes('youtube.com') || url.includes('youtu.be')) ftype = "VIDEO";

                    return (
                      <li key={doc.id || idx} className="border-b border-slate-100 pb-4 last:border-0 relative pl-4">
                        <div className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-[#d32f2f]" />
                        <a href={doc.link} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1 group block">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-slate-800 group-hover:text-postal-blue transition-colors leading-snug">
                              {doc.name}
                            </span>
                            <span className="text-[10px] font-bold text-postal-blue shrink-0 flex items-center">
                              {ftype}
                            </span>
                            {doc.isNew && (
                              <span className="text-[10px] font-bold text-[#d32f2f] uppercase shrink-0">
                                NEW!
                              </span>
                            )}
                          </div>
                      </a>
                    </li>
                  )})}
                  {homepageDocs.length === 0 && (
                    <li className="text-slate-400 text-sm font-medium">No documents available.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Right: Notices & Circulars */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
              <div className="bg-[#e49b3d] text-white p-5 flex items-center gap-3 shrink-0">
                <Bell size={20} />
                <h2 className="text-lg font-black tracking-wide uppercase">Notice / Circular</h2>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center overflow-x-auto border-b border-slate-100 bg-slate-50/50 custom-scrollbar shrink-0">
                {['NOTICE', 'ACCOMMODATION', 'CGHS', 'PENSION/SALARY', 'MISCELLANEOUS'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveNoticeTab(tab)}
                    className={cn(
                      "px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2",
                      activeNoticeTab === tab 
                        ? "text-postal-blue border-postal-blue bg-white" 
                        : "text-slate-500 border-transparent hover:text-slate-800"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <ul className="space-y-6">
                  {notices
                    .filter(n => n.subType?.toUpperCase() === activeNoticeTab || (!n.subType && activeNoticeTab === 'NOTICE'))
                    .map((notice, idx) => (
                    <li key={notice.id || idx} className="border-b border-slate-100 pb-4 last:border-0 relative pl-4">
                      <div className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-[#d32f2f]" />
                      <a href={notice.link || notice.externalLink} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-2 group block">
                        <span className="font-bold text-slate-800 group-hover:text-postal-blue transition-colors leading-snug">
                          {notice.name}
                          {notice.isNew && (
                              <span className="text-[10px] font-bold text-[#d32f2f] uppercase ml-2 animate-pulse">
                                NEW!
                              </span>
                          )}
                        </span>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          PUBLISHED: {notice.createdAt?.toDate ? notice.createdAt.toDate().toISOString().split('T')[0] : 'RECENT'}
                        </div>
                      </a>
                    </li>
                  ))}
                  {notices.filter(n => n.subType?.toUpperCase() === activeNoticeTab || (!n.subType && activeNoticeTab === 'NOTICE')).length === 0 && (
                    <li className="text-slate-400 text-sm font-medium">No notices available for this category.</li>
                  )}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
