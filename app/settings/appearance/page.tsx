export default function AppearanceSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">GÖRÜNÜM</h2>
        <p className="text-zinc-500 text-sm">Sitenin nasıl görüneceğini kişiselleştir.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-3xl bg-zinc-950 border border-purple-500/30 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
           <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
             <div className="w-6 h-6 bg-purple-500 rounded-sm" />
           </div>
           <h3 className="font-bold text-white">Karanlık Tema (Varsayılan)</h3>
           <p className="text-xs text-zinc-500">Siber tonlarda, göz yormayan derin karanlık tema.</p>
           <div className="flex items-center gap-2 text-xs font-black text-purple-400 uppercase tracking-widest">
             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> SEÇİLİ
           </div>
        </div>

        <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 opacity-50 grayscale cursor-not-allowed">
           <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
             <div className="w-6 h-6 bg-white rounded-sm" />
           </div>
           <h3 className="font-bold text-white">Aydınlık Tema</h3>
           <p className="text-xs text-zinc-500">Çok yakında... (Henüz hazır değil)</p>
        </div>
      </div>
    </div>
  );
}
