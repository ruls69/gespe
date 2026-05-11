import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function PensionadoDashboard({ session }) {
  const [usuario, setUsuario] = useState(null);
  const [menu, setMenu] = useState([]);
  const [asistenciaHoy, setAsistenciaHoy] = useState(null);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState({ modalidad: 'local', entrada: '', fuerte: '', postre: '' });
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Perfil
    const { data: user } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();
    if (user) {
      setUsuario(user);
      if (user.creditos_restantes <= 5 && !window.alertaSaldoMostrada) {
        alert(`⚠️ ALERTA DE SALDO: Solo te quedan ${user.creditos_restantes} créditos disponibles.\n\nPor favor pasa por Caja para recargar tu cuenta y evitar quedarte sin almuerzo.`);
        window.alertaSaldoMostrada = true; // Para que no salte cada vez que presione "Actualizar"
      }
    }

    // Menú de hoy
    const { data: menuData } = await supabase.from('platos_menu').select('*').eq('fecha', hoy).eq('disponible', true);
    if (menuData) setMenu(menuData);

    // Asistencia de hoy
    const { data: asistencia } = await supabase.from('asistencias_pensionados')
      .select('*, entrada:seleccion_entrada_id(nombre), fuerte:seleccion_fuerte_id(nombre), postre:seleccion_postre_id(nombre)')
      .eq('usuario_id', session.user.id)
      .eq('fecha', hoy)
      .single();
    if (asistencia) setAsistenciaHoy(asistencia);
  };

  const confirmarAsistencia = async () => {
    if (!seleccion.entrada || !seleccion.fuerte || !seleccion.postre) {
      alert("Por favor selecciona un plato de cada categoría."); return;
    }
    setProcesando(true);
    
    const { error } = await supabase.from('asistencias_pensionados').insert([{
      usuario_id: session.user.id,
      modalidad: seleccion.modalidad,
      seleccion_entrada_id: seleccion.entrada,
      seleccion_fuerte_id: seleccion.fuerte,
      seleccion_postre_id: seleccion.postre
    }]);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      cargarDatos(); // Recargar estado (mostrará el ticket)
      setModalAbierto(false);
    }
    setProcesando(false);
  };

  const declararFalta = async () => {
    if (window.confirm("¿Seguro que no asistirás hoy? No se te descontará crédito.")) {
      setProcesando(true);
      await supabase.from('asistencias_pensionados').insert([{
        usuario_id: session.user.id,
        estado: 'falto',
        modalidad: 'local' // Irrelevante
      }]);
      cargarDatos();
      setProcesando(false);
    }
  };

  if (!usuario) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Cargando perfil...</div>;

  const entradas = menu.filter(p => p.categoria === 'entrada');
  const fuertes = menu.filter(p => p.categoria === 'fuerte');
  const postres = menu.filter(p => p.categoria === 'postre' || p.categoria === 'bebida');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col relative font-sans custom-scrollbar">
      {/* Botones Flotantes Arriba */}
      <div className="absolute top-6 right-6 flex gap-3">
        <button onClick={cargarDatos} className="text-emerald-400 text-sm font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/30 hover:bg-emerald-500/20 transition shadow-lg">🔄 Actualizar</button>
        <button onClick={() => supabase.auth.signOut()} className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 px-4 py-2 rounded-full transition shadow-lg">Salir</button>
      </div>

      {/* Encabezado */}
      <header className="pt-12 pb-8 px-6 text-center bg-gradient-to-b from-emerald-900/40 to-transparent">
        <h2 className="text-slate-300 font-light text-xl mb-2">Hola, {usuario.nombre.split(' ')[0]} 👋</h2>
        <h1 className="text-xl font-medium">Tienes <span className="block text-7xl font-extrabold text-emerald-400 my-1 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">{usuario.creditos_restantes}</span> créditos</h1>
        
        {usuario.creditos_restantes <= 5 && (
          <div className="mt-4 inline-block bg-amber-500/20 text-amber-400 border border-amber-500/50 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
            ⚠️ ¡Te quedan muy pocos créditos!
          </div>
        )}
      </header>

      {!asistenciaHoy ? (
        <main className="flex-1 px-6 flex flex-col gap-6 pb-8 max-w-md w-full mx-auto">
          {/* Card Menu Resumen */}
          <div className="bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wider shadow-lg">Menú del Día</div>
            <p className="text-slate-400 text-center text-sm mt-4 mb-2">Opciones disponibles hoy en cocina:</p>
            <div className="text-sm font-light text-center space-y-2">
              <p>Entradas: {entradas.map(e => e.nombre).join(' o ')}</p>
              <p>Fuertes: {fuertes.map(e => e.nombre).join(' o ')}</p>
              <p>Postres: {postres.map(e => e.nombre).join(' o ')}</p>
            </div>
          </div>

          {/* Recordatorio de Hora Límite */}
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-center text-xs text-red-300">
            <strong>⏰ RECORDATORIO:</strong> Tienes hasta las <strong>12:00 AM</strong> para confirmar tu asistencia o declarar falta. De lo contrario, el sistema asumirá que asistes y descontará 1 crédito automáticamente.
          </div>

          {/* Botones de Decisión */}
          <div className="mt-auto flex flex-col gap-3">
            <button onClick={() => setModalAbierto(true)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xl font-extrabold py-5 rounded-[1.5rem] shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-transform active:scale-95">✅ Asistiré hoy</button>
            <button onClick={declararFalta} disabled={procesando} className="w-full bg-transparent border-2 border-slate-700 text-slate-400 hover:text-white text-lg font-bold py-4 rounded-[1.5rem] transition-colors active:scale-95">✖️ Faltaré hoy</button>
          </div>
        </main>
      ) : (
        <main className="flex-1 px-6 flex flex-col items-center justify-center text-center pb-20 max-w-md w-full mx-auto">
          {asistenciaHoy.estado === 'falto' ? (
            <>
              <div className="text-7xl mb-4">👍</div>
              <h2 className="text-2xl font-bold mb-2">Falta Registrada</h2>
              <p className="text-slate-400">Gracias por avisar. No se descontó ningún crédito hoy.</p>
            </>
          ) : asistenciaHoy.estado === 'entregado' ? (
             <>
              <div className="text-7xl mb-4">😋</div>
              <h2 className="text-2xl font-bold mb-2">¡Buen provecho!</h2>
              <p className="text-slate-400">Tu ticket de hoy ya fue cobrado y entregado en caja.</p>
            </>
          ) : (
            <div className="bg-slate-800/80 p-8 rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 w-full">
              <div className="text-6xl mb-4 animate-bounce">🍽️</div>
              <h2 className="text-2xl font-bold mb-4 text-emerald-400">¡Pedido Enviado!</h2>
              <p className="text-slate-300 mb-6 text-sm">Caja y Cocina ya tienen tu selección. Muestra esta pantalla al llegar.</p>
              
              <div className="bg-slate-900 p-4 rounded-xl text-left text-sm space-y-2 border border-slate-700">
                <p><span className="text-slate-500 uppercase text-xs font-bold w-16 inline-block">Para:</span> <strong className="uppercase text-white">{asistenciaHoy.modalidad}</strong></p>
                <p><span className="text-slate-500 uppercase text-xs font-bold w-16 inline-block">Entrada:</span> {asistenciaHoy.entrada?.nombre}</p>
                <p><span className="text-slate-500 uppercase text-xs font-bold w-16 inline-block">Fuerte:</span> {asistenciaHoy.fuerte?.nombre}</p>
                <p><span className="text-slate-500 uppercase text-xs font-bold w-16 inline-block">Postre:</span> {asistenciaHoy.postre?.nombre}</p>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Modal Selección de Platos */}
      {modalAbierto && (
        <div className="absolute inset-0 bg-black/90 flex flex-col z-50 animate-fade-in overflow-y-auto">
          <div className="p-6 pb-20 max-w-md w-full mx-auto">
            <h3 className="text-2xl font-bold mb-2 text-white">Arma tu Almuerzo</h3>
            <p className="text-slate-400 mb-6 text-sm">Selecciona las opciones que vas a consumir hoy.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-emerald-400 font-bold mb-2 uppercase text-xs tracking-wider">1. Modalidad</label>
                <div className="flex gap-2">
                  <button onClick={() => setSeleccion({...seleccion, modalidad: 'local'})} className={`flex-1 py-4 rounded-xl font-bold border-2 ${seleccion.modalidad === 'local' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400'}`}>En Mesa</button>
                  <button onClick={() => setSeleccion({...seleccion, modalidad: 'llevar'})} className={`flex-1 py-4 rounded-xl font-bold border-2 ${seleccion.modalidad === 'llevar' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400'}`}>Para Llevar</button>
                </div>
              </div>

              <div>
                <label className="block text-emerald-400 font-bold mb-2 uppercase text-xs tracking-wider">2. Entrada / Sopa</label>
                <select value={seleccion.entrada} onChange={e => setSeleccion({...seleccion, entrada: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white outline-none focus:border-emerald-500">
                  <option value="">-- Selecciona --</option>
                  {entradas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-emerald-400 font-bold mb-2 uppercase text-xs tracking-wider">3. Plato Fuerte</label>
                <select value={seleccion.fuerte} onChange={e => setSeleccion({...seleccion, fuerte: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white outline-none focus:border-emerald-500">
                  <option value="">-- Selecciona --</option>
                  {fuertes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-emerald-400 font-bold mb-2 uppercase text-xs tracking-wider">4. Postre / Bebida</label>
                <select value={seleccion.postre} onChange={e => setSeleccion({...seleccion, postre: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white outline-none focus:border-emerald-500">
                  <option value="">-- Selecciona --</option>
                  {postres.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button onClick={confirmarAsistencia} disabled={procesando} className="w-full bg-emerald-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg">Enviar a Cocina</button>
              <button onClick={() => setModalAbierto(false)} className="w-full text-slate-400 font-bold py-3 uppercase tracking-wider">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.2s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
