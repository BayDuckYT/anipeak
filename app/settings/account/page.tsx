export default function AccountSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">HESAP AYARLARI</h2>
        <p className="text-zinc-500 text-sm">Güvenlik ve hesap bilgilerini buradan yönetebilirsin.</p>
      </div>

      <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">E-posta Adresi</label>
            <input type="email" value="murathan@example.com" disabled className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-500 cursor-not-allowed text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Telefon Numarası</label>
            <input type="text" placeholder="Ekle..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:border-purple-500 transition-all text-sm" />
          </div>
        </div>
        
        <div className="pt-4">
           <button className="px-6 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 transition-all">Şifreyi Değiştir</button>
        </div>
      </div>
    </div>
  );
}
