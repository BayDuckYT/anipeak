import Link from 'next/link';
import { 
  User, 
  Settings, 
  Palette, 
  Bell, 
  ShieldCheck, 
  CreditCard,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { id: 'profile', label: 'Kullanıcı Profili', icon: User, href: '/settings/profile' },
    { id: 'account', label: 'Hesap Ayarları', icon: Settings, href: '/settings/account' },
    { id: 'appearance', label: 'Görünüm', icon: Palette, href: '/settings/appearance' },
    { id: 'notifications', label: 'Bildirimler', icon: Bell, href: '/settings/notifications' },
    { id: 'security', label: 'Güvenlik', icon: ShieldCheck, href: '/settings/security' },
    { id: 'billing', label: 'Abonelik ve Ödemeler', icon: CreditCard, href: '/settings/billing' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 font-sans selection:bg-purple-500/30">
      <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-[280px] shrink-0">
            <div className="sticky top-8 space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight mb-2 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                  AYARLAR
                </h1>
                <p className="text-zinc-500 text-sm">
                  Hesabını ve deneyimini buradan yönetebilirsin.
                </p>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-zinc-800/50 hover:shadow-lg border border-transparent hover:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                        <item.icon size={18} />
                      </div>
                      <span className="text-sm font-semibold text-zinc-400 group-hover:text-zinc-100 transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-all group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </nav>

              <div className="pt-6 border-t border-zinc-800">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold text-sm group">
                  <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-red-500/20 transition-colors">
                    <LogOut size={18} />
                  </div>
                  Çıkış Yap
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-[2rem] p-6 md:p-10 shadow-2xl">
            {children}
          </main>
        </div>
      </div>

      {/* Global Aesthetics - Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
