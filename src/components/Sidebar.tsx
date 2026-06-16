'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITES } from '@/config/sites';
import {
  BarChart3,
  ShoppingCart,
  Users,
  FileText,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-gray-900" />
              <span className="text-lg font-bold text-gray-900">Analytics Hub</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
              aria-label="Zavřít menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <Link
              href="/"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                pathname === '/'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Přehled všech webů
            </Link>

            <div className="mt-6">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Weby
              </p>
              <div className="mt-2 space-y-1">
                {SITES.map((site) => (
                  <Link
                    key={site.id}
                    href={`/${site.propertyId}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      pathname.includes(site.propertyId)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {site.category === 'ecommerce' ? (
                      <ShoppingCart className="h-4 w-4" />
                    ) : site.category === 'leadgen' ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="flex-1 truncate">{site.name}</span>
                    <span className="text-xs text-gray-400">{site.domain}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="border-t border-gray-200 p-3">
            <a
              href="/api/auth/signout"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Odhlásit se
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
