import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  ArrowRight, Mail, Briefcase, Stamp, Package, Users, MoreHorizontal 
} from 'lucide-react';

const BRANCHES = [
  { name: 'Mail Branch', icon: Mail, desc: 'Mail processing and delivery operations' },
  { name: 'BD Branch', icon: Briefcase, desc: 'Business Development and marketing' },
  { name: 'Philately Branch', icon: Stamp, desc: 'Stamps and collector services' },
  { name: 'Parcel Branch', icon: Package, desc: 'Parcel and logistics management' },
  { name: 'CCS Branch', icon: Users, desc: 'Central Civil Services guidelines' },
  { name: 'Other Branch', icon: MoreHorizontal, desc: 'Miscellaneous postal operations' },
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

export function MyBranchPortal() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-y border-slate-200 py-16 min-h-[calc(100vh-200px)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-postal-red mb-4">My Branch Portal</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Access specialized resources and operational guidelines for various postal branches.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {BRANCHES.map((branch, i) => {
            const color = CARD_COLORS[(i + 4) % CARD_COLORS.length];
            return (
              <motion.div
                key={branch.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => {
                  if (branch.name === 'BD Branch') {
                    window.open('https://bd-branch-dhenkanal.vercel.app/', '_blank');
                  } else if (branch.name === 'Mail Branch') {
                    window.open('https://mail-branch.vercel.app/', '_blank');
                  } else if (branch.name === 'Savings Branch') {
                    navigate('/branch/savings');
                  } else if (branch.name === 'Other Branch') {
                    navigate('/branch/other');
                  } else if (branch.name === 'Philately Branch') {
                    window.open('https://philately.vercel.app/', '_blank');
                  }
                }}
                className={cn(
                  "group p-8 bg-white rounded-[2rem] border-2 shadow-lg transition-all cursor-pointer",
                  color.border,
                  color.shadow
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 shadow-md",
                  color.icon
                )}>
                  <branch.icon size={32} />
                </div>
                <h3 className={cn("text-2xl font-black mb-2 uppercase tracking-tight", color.text)}>{branch.name}</h3>
                <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed opacity-80 group-hover:opacity-100">{branch.desc}</p>
                <div className={cn(
                  "flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all",
                  color.text
                )}>
                  Explore Branch <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
