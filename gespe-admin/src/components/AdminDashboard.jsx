import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../supabaseClient';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('platos');

  // Estados Platos
  const hoyStr = new Date().toISOString().split('T')[0];
  const [platos, setPlatos] = useState([]);
  const [platoForm, setPlatoForm] = useState({ categoria: 'fuerte', nombre: '', precio_venta_libre: 0, fecha: hoyStr });
  const [fechaFiltro, setFechaFiltro] = useState(hoyStr);

  // Estados Mesas
  const [mesas, setMesas] = useState([]);
  const [numeroMesa, setNumeroMesa] = useState('');

  // Estados Pensionados
  const [pensionados, setPensionados] = useState([]);
  const [formRecarga, setFormRecarga] = useState({ usuarioId: '', monto: '', creditos: '' });
  const [pensionadoForm, setPensionadoForm] = useState({ email: '', password: '', nombre: '', creditos: 0 });

  // Estados Cajero
  const [cajeros, setCajeros] = useState([]);
  const [cajeroForm, setCajeroForm] = useState({ email: '', password: '', nombre: '' });

  useEffect(() => {
    fetchPlatos();
    fetchMesas();
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    // Filtramos solo los que tienen activo=true o donde activo es null (por retrocompatibilidad)
    const { data } = await supabase.from('usuarios').select('*').order('nombre', { ascending: true });
    if (data) {
      const activos = data.filter(u => u.activo !== false);
      setPensionados(activos.filter(u => u.rol === 'pensionado'));
      setCajeros(activos.filter(u => u.rol === 'cajero'));
    }
  };

  // --- PLATOS ---
  const fetchPlatos = async () => {
    const { data, error } = await supabase.from('platos_menu').select('*').eq('disponible', true).order('fecha', { ascending: false });
    if (error) console.error("Error cargando platos:", error.message);
    if (data) setPlatos(data);
  };

  const handleAddPlato = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('platos_menu').insert([{
      fecha: platoForm.fecha,
      categoria: platoForm.categoria,
      nombre: platoForm.nombre,
      precio_venta_libre: parseFloat(platoForm.precio_venta_libre)
    }]);
    if (error) alert(`Error añadiendo plato: ${error.message}`);
    else {
      setPlatoForm({ ...platoForm, nombre: '', precio_venta_libre: 0 }); // Mantiene la misma fecha y categoría
      fetchPlatos();
    }
  };

  const deletePlato = async (id) => {
    // Usamos 'Soft Delete' (disponible = false) para no romper el historial de ventas
    const { error } = await supabase.from('platos_menu').update({ disponible: false }).eq('id', id);
    if (error) alert(`Error eliminando plato: ${error.message}`);
    else fetchPlatos();
  };

  // --- MESAS ---
  const fetchMesas = async () => {
    const { data } = await supabase.from('mesas_restaurante').select('*').order('numero', { ascending: true });
    if (data) setMesas(data);
  };

  const handleAddMesa = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('mesas_restaurante').insert([{ numero: parseInt(numeroMesa), estado: 'desocupado' }]);
    if (error) alert(`Error añadiendo mesa: ${error.message}`);
    else {
      setNumeroMesa('');
      fetchMesas();
    }
  };

  const toggleEstadoMesa = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'ocupado' ? 'desocupado' : 'ocupado';
    const { error } = await supabase.from('mesas_restaurante').update({ estado: nuevoEstado }).eq('id', id);
    if (error) alert(`Error actualizando mesa: ${error.message}`);
    else fetchMesas();
  };

  const deleteMesa = async (id) => {
    const { error } = await supabase.from('mesas_restaurante').delete().eq('id', id);
    if (error) alert(`Error eliminando mesa: ${error.message}`);
    else fetchMesas();
  };

  // --- USUARIOS (Pensionados y Cajeros) ---
  const registrarUsuario = async (e, rol) => {
    e.preventDefault();
    if (!supabaseAdmin) {
      alert("⚠️ Error: Necesitas configurar VITE_SUPABASE_SERVICE_ROLE_KEY en tu archivo .env para crear usuarios directamente desde este panel.");
      return;
    }

    const form = rol === 'pensionado' ? pensionadoForm : cajeroForm;
    
    // 1. Crear el usuario en auth.users de Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true
    });

    if (authError) {
      alert(`Error creando credenciales: ${authError.message}`);
      return;
    }

    // 2. Insertar su perfil en nuestra tabla 'usuarios'
    const { error: dbError } = await supabase.from('usuarios').insert([{
      id: authData.user.id,
      nombre: form.nombre,
      rol: rol,
      creditos_restantes: rol === 'pensionado' ? parseInt(form.creditos) : 0
    }]);
    
    if (dbError) {
      alert(`Error guardando perfil: ${dbError.message}`);
    } else {
      alert(`¡${rol} creado exitosamente con sus credenciales!`);
      if (rol === 'pensionado') setPensionadoForm({ email: '', password: '', nombre: '', creditos: 0 });
      else setCajeroForm({ email: '', password: '', nombre: '' });
      fetchUsuarios();
    }
  };

  const eliminarUsuario = async (id) => {
    if (window.confirm("¿Seguro que deseas dar de baja a este usuario? (Su historial se ocultará pero las finanzas pasadas se mantienen seguras)")) {
      // 1. Borrado Lógico en nuestra tabla
      const { error } = await supabase.from('usuarios').update({ activo: false }).eq('id', id);
      if (error) {
        alert(`Error ocultando usuario: ${error.message}. (Verifica que creaste la columna 'activo' en Supabase)`);
        return;
      }
      
      // 2. Bloqueo en Supabase Auth para que no pueda volver a entrar (Baneo de 100 años)
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876000h' })
          .catch(e => console.warn('Aviso: No se pudo suspender en auth', e));
      }
      
      fetchUsuarios();
    }
  };

  const procesarRecarga = async (e) => {
    e.preventDefault();
    const { error } = await supabase.rpc('recargar_creditos', {
      p_usuario_id: formRecarga.usuarioId,
      p_monto_pagado: parseFloat(formRecarga.monto),
      p_creditos_a_sumar: parseInt(formRecarga.creditos, 10)
    });
    if (error) alert(error.message);
    else {
      alert('Recarga exitosa');
      setFormRecarga({ usuarioId: '', monto: '', creditos: '' });
      fetchUsuarios();
    }
  };

  // --- PROCEDIMIENTO AUTOMATIZADO ---
  const ejecutarCierreAutomatico = async () => {
    if (window.confirm("¿Seguro que deseas ejecutar el cierre automático (12:00 PM)?\nEsto asignará asistencia por defecto (LLEVAR) a todos los pensionados con saldo que no hayan confirmado hoy.")) {
      const { error } = await supabase.rpc('procesar_asistencias_automaticas');
      if (error) {
        alert(`Error ejecutando cierre: ${error.message}. (Asegúrate de haber creado la función SQL en Supabase).`);
      } else {
        alert("✅ Cierre automático completado. Todos los pensionados faltantes fueron enviados a la fila de Caja para Llevar.");
      }
    }
  };

  const recargarTodo = () => {
    fetchPlatos();
    fetchMesas();
    fetchUsuarios();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-6 md:p-10">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Logística <span className="text-purple-500">GESPE</span></h1>
          <p className="text-slate-400">Administrador de Operaciones</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={recargarTodo} className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition" title="Actualizar datos">🔄</button>
          <button onClick={ejecutarCierreAutomatico} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition">⚡ Forzar Cierre (12:00 PM)</button>
          <button onClick={() => supabase.auth.signOut()} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/40 font-bold transition">Cerrar Sesión</button>
        </div>
      </header>

      {/* Navegación de Tabs */}
      <nav className="flex flex-wrap gap-4 mb-8 border-b border-slate-700 pb-4">
        <button onClick={() => setActiveTab('platos')} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'platos' ? 'bg-purple-600 shadow-lg shadow-purple-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>🍽️ Oferta Gastronómica</button>
        <button onClick={() => setActiveTab('mesas')} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'mesas' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>🪑 Gestión de Mesas</button>
        <button onClick={() => setActiveTab('pensionados')} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'pensionados' ? 'bg-emerald-600 shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>👥 Pensionados & Recargas</button>
        <button onClick={() => setActiveTab('cajeros')} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'cajeros' ? 'bg-amber-600 shadow-lg shadow-amber-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>👤 Cajeros</button>
      </nav>

      {/* CONTENIDO TABS */}
      
      {/* TABS 1 Y 2: Platos y Mesas (Iguales) */}
      {activeTab === 'platos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-800/60 p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold mb-6">➕ Programar Plato</h2>
            <form onSubmit={handleAddPlato} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Fecha del Menú</label>
                <input type="date" required value={platoForm.fecha} onChange={e => setPlatoForm({...platoForm, fecha: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white font-bold text-emerald-400 outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Categoría</label>
                <select value={platoForm.categoria} onChange={e => setPlatoForm({...platoForm, categoria: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white">
                  <option value="entrada">Entrada / Sopa</option>
                  <option value="fuerte">Plato Fuerte</option>
                  <option value="postre">Postre</option>
                  <option value="bebida">Bebida</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Nombre del Plato</label>
                <input type="text" required value={platoForm.nombre} onChange={e => setPlatoForm({...platoForm, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" placeholder="Ej: Lomo Saltado" />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Precio Venta Libre (Bs)</label>
                <input type="number" step="0.5" required value={platoForm.precio_venta_libre} onChange={e => setPlatoForm({...platoForm, precio_venta_libre: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" />
              </div>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg shadow-lg">Registrar Plato</button>
            </form>
          </div>
          
          <div className="lg:col-span-2 bg-slate-800/60 p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
              <h2 className="text-xl font-bold">📋 Menú Programado</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Ver fecha:</label>
                <input type="date" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)} className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['entrada', 'fuerte', 'postre', 'bebida'].map(cat => {
                const platosFiltrados = platos.filter(p => p.categoria === cat && p.fecha === fechaFiltro);
                return (
                  <div key={cat} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <h3 className="uppercase text-xs font-bold text-slate-400 tracking-wider mb-3 flex justify-between">
                      {cat}s <span className="bg-slate-800 px-2 rounded-full">{platosFiltrados.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {platosFiltrados.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg">
                          <div>
                            <span className="font-medium block">{p.nombre}</span>
                            <span className="text-xs text-emerald-400">Bs. {p.precio_venta_libre}</span>
                          </div>
                          <button onClick={() => deletePlato(p.id)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg">🗑️</button>
                        </div>
                      ))}
                      {platosFiltrados.length === 0 && <p className="text-xs text-slate-600 italic">No programado</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mesas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-800/60 p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold mb-6">➕ Añadir Mesa</h2>
            <form onSubmit={handleAddMesa} className="flex gap-4">
              <input type="number" required value={numeroMesa} onChange={e => setNumeroMesa(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" placeholder="N° de Mesa" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg shadow-lg">Crear</button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-slate-800/60 p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold mb-6">🪑 Plano de Mesas</h2>
            <div className="flex flex-wrap gap-4">
              {mesas.map(m => (
                <div key={m.id} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all w-32 ${m.estado === 'ocupado' ? 'bg-red-900/20 border-red-500/50' : 'bg-emerald-900/20 border-emerald-500/50'}`}>
                  <span className="text-2xl font-black">#{m.numero}</span>
                  <button onClick={() => toggleEstadoMesa(m.id, m.estado)} className={`px-3 py-1 rounded text-xs font-bold ${m.estado === 'ocupado' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-slate-900'}`}>{m.estado.toUpperCase()}</button>
                  <button onClick={() => deleteMesa(m.id)} className="text-red-400 text-xs mt-2 hover:underline">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENSIONADOS */}
      {activeTab === 'pensionados' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Zona de Registro y Recargas */}
          <div className="xl:col-span-5 space-y-6">
            
            {/* Formulario de Recarga */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-white/5 shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-emerald-400">💰 Recargar Créditos</h2>
              <form onSubmit={procesarRecarga} className="space-y-4">
                <select required value={formRecarga.usuarioId} onChange={e => setFormRecarga({...formRecarga, usuarioId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white">
                  <option value="">-- Seleccionar Pensionado --</option>
                  {pensionados.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.creditos_restantes} cr)</option>)}
                </select>
                <div className="flex gap-4">
                  <input type="number" required placeholder="Monto (Bs)" value={formRecarga.monto} onChange={e => setFormRecarga({...formRecarga, monto: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" />
                  <input type="number" required placeholder="Créditos" value={formRecarga.creditos} onChange={e => setFormRecarga({...formRecarga, creditos: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-lg text-emerald-400 font-bold" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg">Ejecutar Recarga Atómica</button>
              </form>
            </div>

            {/* Formulario Alta de Pensionado */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold mb-2">➕ Alta de Pensionado</h2>
              <p className="text-xs text-slate-400 mb-4">Crea directamente la cuenta de acceso y perfil del usuario.</p>
              <form onSubmit={e => registrarUsuario(e, 'pensionado')} className="space-y-4">
                <input type="email" required placeholder="Correo Electrónico" value={pensionadoForm.email} onChange={e => setPensionadoForm({...pensionadoForm, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" />
                <input type="password" required placeholder="Contraseña Segura" value={pensionadoForm.password} onChange={e => setPensionadoForm({...pensionadoForm, password: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" />
                <input type="text" required placeholder="Nombre Completo" value={pensionadoForm.nombre} onChange={e => setPensionadoForm({...pensionadoForm, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" />
                <input type="number" placeholder="Créditos Iniciales (Opcional)" value={pensionadoForm.creditos} onChange={e => setPensionadoForm({...pensionadoForm, creditos: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" />
                <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg">Crear Cuenta</button>
              </form>
            </div>

          </div>

          {/* Tabla de Pensionados */}
          <div className="xl:col-span-7 bg-slate-800/60 p-6 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold mb-4">📋 Lista de Pensionados</h2>
            <div className="overflow-y-auto flex-1 pr-2">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900 text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Saldo</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {pensionados.map(p => (
                    <tr key={p.id} className="hover:bg-slate-700/30">
                      <td className="p-3 font-medium text-white">{p.nombre}</td>
                      <td className={`p-3 font-bold ${p.creditos_restantes <= 3 ? 'text-red-400' : 'text-emerald-400'}`}>{p.creditos_restantes} cr</td>
                      <td className="p-3 text-right">
                        <button onClick={() => eliminarUsuario(p.id)} className="text-red-400 hover:underline">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {pensionados.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-slate-500">No hay pensionados registrados</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CAJEROS */}
      {activeTab === 'cajeros' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold mb-2">👤 Alta de Cajero</h2>
            <p className="text-xs text-slate-400 mb-4">Crea la credencial de acceso para el sistema de Caja (POS).</p>
            <form onSubmit={e => registrarUsuario(e, 'cajero')} className="space-y-4">
              <input type="email" required placeholder="Correo Electrónico" value={cajeroForm.email} onChange={e => setCajeroForm({...cajeroForm, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" />
              <input type="password" required placeholder="Contraseña Segura" value={cajeroForm.password} onChange={e => setCajeroForm({...cajeroForm, password: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" />
              <input type="text" required placeholder="Nombre del Cajero" value={cajeroForm.nombre} onChange={e => setCajeroForm({...cajeroForm, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white" />
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg shadow-lg">Crear Cuenta de Cajero</button>
            </form>
          </div>
          
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold mb-4">📋 Lista de Cajeros</h2>
            <ul className="space-y-3">
              {cajeros.map(c => (
                <li key={c.id} className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <span className="font-bold text-white">{c.nombre}</span>
                  <button onClick={() => eliminarUsuario(c.id)} className="text-red-400 hover:underline text-sm">Despedir/Eliminar</button>
                </li>
              ))}
              {cajeros.length === 0 && <li className="text-slate-500 text-center py-4">No hay cajeros en el sistema</li>}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
