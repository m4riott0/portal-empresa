import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Beneficiários', icon: Users, path: '/beneficiarios' },
  { title: 'Copart. Pré-faturada', icon: Receipt, path: '/copart-pre-fatura' },
  { title: 'Documentos Financeiros', icon: FileText, path: '/docs-financeiros' },
];

export function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-white"
    >
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      </div>
    </motion.aside>
  );
}
