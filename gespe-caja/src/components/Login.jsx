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
        alert("Acceso denegado: Tu perfil de empleado fue eliminado del sistema o no tienes asignado un rol.");
        setError('Perfil no encontrado.');
        await supabase.auth.signOut();
      } else if (userData.activo === false) {
        alert("Acceso denegado: Tu cuenta de cajero ha sido dada de baja por la administración.");
        setError('Cuenta deshabilitada.');
        await supabase.auth.signOut();
      } else if (userData.rol !== 'cajero') {
        alert(`Acceso denegado: El sistema detecta que tu rol es '${userData.rol}', no Cajero.`);
        setError('Acceso denegado: No eres Cajero.');
        await supabase.auth.signOut();
      } else {
        setSession(data.session);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md bg-slate-800/60 p-8 rounded-3xl border border-emerald-500/20 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white text-center mb-2">Punto de Venta <span className="text-emerald-500">GESPE</span></h2>
        <p className="text-slate-400 text-center mb-8">Ingreso Exclusivo para Cajeros</p>
        
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center mb-6">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:border-emerald-500 outline-none"
            placeholder="Correo del Cajero" />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:border-emerald-500 outline-none"
            placeholder="Contraseña" />
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)]">
            {loading ? 'Entrando...' : 'Abrir Caja'}
          </button>
        </form>
      </div>
    </div>
  );
}
