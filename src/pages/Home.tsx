import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import ReactPlayer from 'react-player';
import { 
  ArrowRight, BookOpen, Video, PenTool, Trophy, ChevronRight, 
  Download, GraduationCap, Bell, Newspaper, Calendar, Info, 
  ExternalLink, FileText, LayoutGrid, Search, Users, Book,
  Globe, Mail, Phone, MapPin, Facebook, Twitter, Youtube, Instagram,
  Briefcase, Stamp, Package, MoreHorizontal, Calculator,
  AlertCircle, Landmark, ShieldCheck, Fingerprint, Map, FileDown, Smartphone, Send, FileBadge, ImageIcon, AppWindow
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

const QUICK_LINKS = [
  { icon: BookOpen, title: "GDS TO MTS", desc: "Study material for MTS recruitment", link: "/portal/mts" },
  { icon: GraduationCap, title: "POSTMAN EXAM", desc: "Resources for Postman/Mail Guard", link: "/portal/postman" },
  { icon: Trophy, title: "PA/SA EXAM", desc: "Postal & Sorting Assistant material", link: "/portal/pa" },
  { icon: LayoutGrid, title: "LGO EXAM", desc: "Lower Grade Official promotion", link: "/portal/lgo" },
  { icon: Newspaper, title: "IP EXAM", desc: "Inspector Posts preparation", link: "/portal/inspector" },
  { icon: Book, title: "PO GUIDE", desc: "Post Office Guide Part I & II", link: "/portal/po-guide" },
  { icon: FileText, title: "POSTAL MANUALS", desc: "Volume V, VI, and VII resources", link: "/portal/manuals" },
  { icon: Calculator, title: "ACCOUNTANT EXAM", desc: "PO Accountant Exam resources", link: "/portal/accountant" },
  { icon: MoreHorizontal, title: "OTHERS", desc: "Miscellaneous portal documents", link: "/portal/others" },
];

const BRANCHES = [
  { name: 'Mail Branch', icon: Mail, desc: 'Mail processing and delivery operations' },
  { name: 'BD Branch', icon: Briefcase, desc: 'Business Development and marketing' },
  { name: 'Philately Branch', icon: Stamp, desc: 'Stamps and collector services' },
  { name: 'Parcel Branch', icon: Package, desc: 'Parcel and logistics management' },
  { name: 'CCS Branch', icon: Users, desc: 'Central Civil Services guidelines' },
  { name: 'Other Branch', icon: MoreHorizontal, desc: 'Miscellaneous postal operations' },
];

const SERVICES = [
  { title: "Track Consignment", icon: Search, color: "text-emerald-600", bg: "bg-emerald-50", link: "https://www.indiapost.gov.in/" },
  { title: "PMV Ticket raise", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", link: "https://pmv-toolkit.vercel.app/" },
  { title: "Locate Post Office", icon: MapPin, color: "text-postal-red", bg: "bg-red-50" },
  { title: "Internet Banking", icon: Landmark, color: "text-amber-600", bg: "bg-amber-50", link: "https://ebanking.indiapost.gov.in/corp/AuthenticationController?FORMSGROUP_ID__=AuthenticationFG&__START_TRAN_FLAG__=Y&__FG_BUTTONS__=LOAD&ACTION.LOAD=Y&AuthenticationFG.LOGIN_FLAG=1&BANK_ID=DOP" },
  { title: "PLI / RPLI", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Postage Calculator", icon: Calculator, color: "text-orange-500", bg: "bg-orange-50", link: "https://www.indiapost.gov.in/calculate-postage" },
  { title: "Aadhaar Services", icon: Fingerprint, color: "text-indigo-600", bg: "bg-indigo-50" },
  { title: "DIGIPIN", icon: Map, color: "text-rose-500", bg: "bg-rose-50", link: "https://dac.indiapost.gov.in/mydigipin/home" },
  { title: "Download Forms", icon: FileDown, color: "text-slate-600", bg: "bg-slate-50", link: "https://postal-forms.vercel.app/" },
  { title: "Ready Reckoner", icon: Book, color: "text-amber-800", bg: "bg-amber-50", link: "https://drive.google.com/file/d/1FfyMvtgGqJIKPZ0u3dEi_l6npik7t9oL/view?usp=sharing" },
  { title: "IPPB Service", icon: Smartphone, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Money Transfer", icon: Send, color: "text-cyan-600", bg: "bg-cyan-50" },
];

const CARD_COLORS = [
  { border: 'border-blue-500', icon: 'bg-blue-50 text-blue-600', text: 'text-blue-700', shadow: 'hover:shadow-blue-500/20', accent: 'bg-blue-600' },
  { border: 'border-emerald-500', icon: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-700', shadow: 'hover:shadow-emerald-500/20', accent: 'bg-emerald-600' },
  { border: 'border-rose-500', icon: 'bg-rose-50 text-rose-600', text: 'text-rose-700', shadow: 'hover:shadow-rose-500/20', accent: 'bg-rose-600' },
  { border: 'border-amber-500', icon: 'bg-amber-50 text-amber-600', text: 'text-amber-700', shadow: 'hover:shadow-amber-500/20', accent: 'bg-amber-600' },
  { border: 'border-violet-500', icon: 'bg-violet-50 text-violet-600', text: 'text-violet-700', shadow: 'hover:shadow-violet-500/20', accent: 'bg-violet-600' },
  { border: 'border-cyan-500', icon: 'bg-cyan-50 text-cyan-600', text: 'text-cyan-700', shadow: 'hover:shadow-cyan-500/20', accent: 'bg-cyan-600' },
  { border: 'border-orange-500', icon: 'bg-orange-50 text-orange-600', text: 'text-orange-700', shadow: 'hover:shadow-orange-500/20', accent: 'bg-orange-600' },
  { border: 'border-indigo-500', icon: 'bg-indigo-50 text-indigo-600', text: 'text-indigo-700', shadow: 'hover:shadow-indigo-500/20', accent: 'bg-indigo-600' },
];

export function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [homepageDocs, setHomepageDocs] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [photoGallery, setPhotoGallery] = useState<any[]>([]);
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

    const qGallery = query(
      collection(db, 'portal_documents'),
      where('category', '==', 'Photo Gallery')
    );
    const unsubscribeGallery = onSnapshot(qGallery, (snapshot) => {
      const sortedDocs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPhotoGallery(sortedDocs);
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
      unsubscribeNotices();
      unsubscribeAnnouncements();
      unsubscribeHero();
      unsubscribeGallery();
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
                  <div className="flex gap-4">
                    <button className="bg-postal-yellow text-slate-900 px-8 py-3 rounded-sm font-bold hover:bg-white transition-colors">
                      Learn More
                    </button>
                    <button className="border-2 border-white text-white px-8 py-3 rounded-sm font-bold hover:bg-white/10 transition-colors">
                      Explore Resources
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

      {/* Quick Links Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {QUICK_LINKS.map((item, i) => {
            const color = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <Link
                key={i}
                to={item.link}
                className="block group"
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={cn(
                    "bg-white p-6 rounded-3xl shadow-xl border-l-8 transition-all h-full text-center flex flex-col items-center",
                    color.border,
                    color.shadow
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110",
                    color.icon
                  )}>
                    <item.icon size={28} />
                  </div>
                  <h3 className={cn("font-black text-sm uppercase tracking-tight mb-1", color.text)}>{item.title}</h3>
                  <p className="text-[10px] text-slate-500 leading-tight font-medium opacity-70 group-hover:opacity-100 transition-opacity uppercase tracking-widest">{item.desc}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>



      {/* Our Services Section */}
      <div className="bg-slate-50 py-20 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-postal-yellow text-slate-900 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm">
              Our Services
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-4">What would you like to do today?</h2>
            <p className="text-slate-500">Access all postal services of Dhenkanal Division</p>
            <div className="w-20 h-1 bg-postal-yellow mx-auto mt-6 rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SERVICES.map((service, i) => {
              const CardContent = (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-sm shadow-sm border border-slate-100 flex flex-col items-center text-center group cursor-pointer hover:shadow-md transition-all h-full"
                >
                  <div className={`w-12 h-12 ${service.bg} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon size={24} className={service.color} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-700 leading-tight">{service.title}</h3>
                </motion.div>
              );

              if (service.link) {
                return (
                  <a 
                    key={service.title} 
                    href={service.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    {CardContent}
                  </a>
                );
              }

              return (
                <div key={service.title}>
                  {CardContent}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left: News & Announcements */}
        <div className="lg:col-span-4 space-y-8">
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

        {/* Right: Bulletin Boards */}
        <div className="lg:col-span-8 space-y-8">
          
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

      {/* Photo Gallery Section */}
      {photoGallery.length > 0 && (
        <div className="bg-white py-16 border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8 pb-2 border-b-2 border-postal-red">
              <h2 className="text-2xl font-bold text-postal-red flex items-center gap-2">
                <ImageIcon size={24} /> Photo Gallery
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photoGallery.map((photo) => (
                <div key={photo.id} className="group cursor-pointer">
                  <div className="relative h-48 rounded-lg overflow-hidden bg-slate-100 shadow-sm border border-slate-200 mb-3">
                    <img
                      src={photo.link}
                      alt={photo.name || 'Gallery Image'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Search className="text-white w-8 h-8 opacity-75" />
                    </div>
                  </div>
                  {photo.name && (
                    <p className="text-sm font-medium text-slate-700 text-center line-clamp-2">
                      {photo.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
