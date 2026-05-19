import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ setSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError('Credenciales inválidas');
    } else {
      const { data: userData, error: userError } = await supabase.from('usuarios').select('rol').eq('id', data.user.id).single();
      
      if (userError) {
        console.error("Error leyendo perfil:", userError);
        setError('Falta la política RLS en la tabla usuarios o el perfil no existe.');
        await supabase.auth.signOut();
      } else if (userData?.rol !== 'administrador') {
        setError(`No tienes permisos. Tu rol actual es: ${userData?.rol}`);
        await supabase.auth.signOut();
      } else {
        setSession(data.session);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md bg-slate-800/60 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
        <h2 className="text-3xl font-extrabold text-white text-center mb-2">GESPE <span className="text-purple-500">Admin</span></h2>
        <p className="text-slate-400 text-center mb-8">Centro de Control Logístico</p>
        
        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg text-center mb-6">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-300 mb-2 font-medium">Correo Electrónico</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-colors"
              placeholder="admin@gespe.com" />
          </div>
          <div>
            <label className="block text-slate-300 mb-2 font-medium">Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-colors"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(147,51,234,0.3)] transition-all active:scale-95">
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
