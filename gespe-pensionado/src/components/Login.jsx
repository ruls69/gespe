import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ setSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      setError('Credenciales inválidas');
    } else {
      const { data: userData, error: userError } = await supabase.from('usuarios').select('rol, activo').eq('id', data.user.id).maybeSingle();
      
      if (userError) {
        alert(`Error de base de datos: ${userError.message}`);
        await supabase.auth.signOut();
      } else if (!userData) {
        alert("Acceso denegado: Tu perfil fue eliminado de la base de datos.");
        setError('Perfil no encontrado.');
        await supabase.auth.signOut();
      } else if (userData.activo === false) {
        alert("Acceso denegado: Tu cuenta de pensionado ha sido dada de baja por la administración.");
        setError('Cuenta deshabilitada.');
        await supabase.auth.signOut();
      } else if (userData.rol !== 'pensionado') {
        alert(`Acceso denegado: El sistema detecta que tu rol es '${userData.rol}', no Pensionado.`);
        setError('Acceso denegado: No eres Pensionado.');
        await supabase.auth.signOut();
      } else {
        setSession(data.session);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 justify-center p-6">
      <div className="w-full max-w-sm mx-auto bg-slate-800/60 p-8 rounded-[2rem] border border-white/10 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white text-center mb-8">GESPE <span className="text-emerald-500 block text-lg">App Pensionado</span></h2>
        
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-xl text-center mb-6 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:border-emerald-500 outline-none"
            placeholder="Correo Electrónico" />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:border-emerald-500 outline-none"
            placeholder="Contraseña" />
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold py-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-transform active:scale-95 mt-4">
            {loading ? 'Ingresando...' : 'Entrar a mi cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
