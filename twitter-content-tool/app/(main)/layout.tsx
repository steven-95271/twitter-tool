'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/inspirations', label: '灵感库' },
  { href: '/personas', label: '人设管理' },
  { href: '/generate', label: '生成推文' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <aside className="w-56 border-r border-gray-800 p-4 flex flex-col">
        <Link href="/" className="mb-8">
          <h1 className="text-xl font-bold text-blue-400">Twitter 内容工具</h1>
        </Link>
        <nav className="flex flex-col gap-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg transition-colors ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
