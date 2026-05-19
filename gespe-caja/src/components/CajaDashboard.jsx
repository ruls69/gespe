import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function CajaDashboard({ session }) {
  const [turno, setTurno] = useState(null);
  const [loadingTurno, setLoadingTurno] = useState(true);

  // Estados Asistencias (Fila)
  const [fila, setFila] = useState([]);
  const [ticketActivo, setTicketActivo] = useState(null); // Para la ventana flotante

  // Estados Mesas
  const [mesas, setMesas] = useState([]);

  // Estados Ventas Libres
  const [platos, setPlatos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [totalCarrito, setTotalCarrito] = useState(0);
  const [mesaVentaLibre, setMesaVentaLibre] = useState('');
  const [ticketLibre, setTicketLibre] = useState(null); // Ticket flotante para venta libre

  // Estados Cierre Turno
  const [modalCierre, setModalCierre] = useState(false);
  const [montoDeclarado, setMontoDeclarado] = useState('');
  const [ticketCierre, setTicketCierre] = useState(null); // Resumen de turno

  useEffect(() => {
    verificarTurnoAbierto();
    cargarPlatos();
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    const { data } = await supabase.from('mesas_restaurante').select('*').order('numero');
    if (data) setMesas(data);
  };

  const toggleEstadoMesa = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'ocupado' ? 'desocupado' : 'ocupado';
    await supabase.from('mesas_restaurante').update({ estado: nuevoEstado }).eq('id', id);
    cargarMesas();
  };

  useEffect(() => {
    if (turno) {
      cargarFila();
      // Suscripción a Realtime para la fila
      const subscription = supabase
        .channel('asistencias')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias_pensionados' }, cargarFila)
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [turno]);

  useEffect(() => {
    setTotalCarrito(carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0));
  }, [carrito]);

  const cargarPlatos = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('platos_menu')
      .select('*')
      .eq('fecha', hoy)
      .eq('disponible', true);
    if (data) setPlatos(data);
  };

  const verificarTurnoAbierto = async () => {
    const { data } = await supabase.from('caja_turnos')
      .select('*')
      .eq('cajero_id', session.user.id)
      .eq('estado', 'abierto')
      .single();
    if (data) setTurno(data);
    setLoadingTurno(false);
  };

  const cargarFila = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('asistencias_pensionados')
      .select('*, usuarios(nombre, creditos_restantes), entrada:seleccion_entrada_id(nombre), fuerte:seleccion_fuerte_id(nombre), postre:seleccion_postre_id(nombre)')
      .eq('fecha', hoy)
      .eq('estado', 'pendiente');
    if (error) {
      console.error("Error al cargar fila:", error);
    }
    if (data) setFila(data);
  };

  const abrirTurno = async () => {
    const { data, error } = await supabase.from('caja_turnos').insert([{ cajero_id: session.user.id }]).select().single();
    if (error) {
      alert(`Error abriendo turno: ${error.message} (Verifica que creaste las tablas caja_turnos en la base de datos)`);
      console.error(error);
    }
    if (data) setTurno(data);
  };

  // --- DISPENSAR TICKET PENSIONADO ---
  const dispensarTicket = async (asistencia) => {
    try {
      if (!asistencia.usuarios) {
        alert("❌ Error: No se puede leer el perfil del pensionado. (Falta permiso RLS para que el Cajero lea la tabla usuarios).");
        return;
      }
      if (asistencia.usuarios.creditos_restantes <= 0) {
        alert("❌ Saldo insuficiente."); return;
      }
      const { error } = await supabase.rpc('consumir_almuerzo', { p_asistencia_id: asistencia.id });
      if (error) {
        alert(`Error procesando cobro: ${error.message}`);
      } else {
        setTicketActivo(asistencia); // Abre la ventana flotante
        cargarFila(); // Refresca
      }
    } catch (err) {
      alert(`Error interno: ${err.message}`);
    }
  };

  // --- VENTAS LIBRES ---
  const agregarAlCarrito = (plato) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.id === plato.id);
      if (existe) return prev.map(p => p.id === plato.id ? {...p, cantidad: p.cantidad + 1} : p);
      return [...prev, { ...plato, cantidad: 1, precio: plato.precio_venta_libre }];
    });
  };

  const cobrarVentaLibre = async () => {
    if (carrito.length === 0) return;
    
    const nuevasVentas = carrito.map(item => ({
      turno_id: turno.id,
      plato_id: item.id,
      cantidad: item.cantidad,
      subtotal: item.precio * item.cantidad
    }));

    const { error } = await supabase.from('ventas_libres').insert(nuevasVentas);
    if(error) { alert(`Error guardando venta: ${error.message}`); return; }

    await supabase.from('caja_turnos').update({ total_ventas_libres: turno.total_ventas_libres + totalCarrito }).eq('id', turno.id);
    
    setTurno({...turno, total_ventas_libres: turno.total_ventas_libres + totalCarrito});
    
    // Abre el ticket flotante de venta libre
    setTicketLibre({ items: [...carrito], total: totalCarrito, mesa: mesaVentaLibre });
    
    // Limpia
    setCarrito([]);
    setMesaVentaLibre('');
  };

  // --- CIERRE DE TURNO ---
  const cerrarTurno = async (e) => {
    e.preventDefault();
    const declarado = parseFloat(montoDeclarado);
    const diferencia = declarado - turno.total_ventas_libres;
    const fechaCierre = new Date().toISOString();

    const { error } = await supabase.from('caja_turnos').update({
      estado: 'cerrado',
      fecha_cierre: fechaCierre,
      monto_declarado: declarado,
      diferencia: diferencia
    }).eq('id', turno.id);

    if(error) { alert(`Error cerrando turno: ${error.message}`); return; }

    setTicketCierre({
      ...turno,
      fecha_cierre: fechaCierre,
      monto_declarado: declarado,
      diferencia: diferencia
    });
    
    setModalCierre(false);
  };

  const recargarTodo = () => {
    cargarMesas();
    cargarPlatos();
    if (turno) cargarFila();
  };

  if (loadingTurno) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando...</div>;

  if (!turno) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <h2 className="text-3xl font-bold mb-4">No tienes un turno abierto</h2>
        <p className="text-slate-400 mb-8">Debes aperturar la caja para comenzar a procesar ventas y tickets.</p>
        <button onClick={abrirTurno} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-10 rounded-xl shadow-lg">Abrir Turno Ahora</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-6 md:p-8 flex flex-col h-screen">
      <header className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-500 tracking-tight">Terminal POS</h1>
          <p className="text-sm text-slate-400">Turno Activo | Ventas Libres: Bs. {turno.total_ventas_libres}</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={recargarTodo} className="bg-slate-800 text-slate-400 font-bold px-4 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition">🔄 Actualizar</button>
          <button onClick={() => setModalCierre(true)} className="bg-red-500/20 text-red-400 font-bold px-4 py-2 rounded-lg hover:bg-red-500/40 transition">Cerrar Turno</button>
          <button onClick={() => supabase.auth.signOut()} className="bg-slate-800 text-slate-400 font-bold px-4 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition">Salir</button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
        
        {/* PANEL IZQUIERDO: MESAS */}
        <div className="glass-panel flex flex-col p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4 text-amber-400">🪑 Mesas del Local</h2>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-wrap gap-3 content-start">
            {mesas.map(m => (
              <button 
                key={m.id} 
                onClick={() => toggleEstadoMesa(m.id, m.estado)} 
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all w-[30%] ${m.estado === 'ocupado' ? 'bg-red-900/40 border-red-500/50 hover:bg-red-800/50' : 'bg-emerald-900/40 border-emerald-500/50 hover:bg-emerald-800/50'}`}>
                <span className="text-xl font-black">#{m.numero}</span>
                <span className={`text-[10px] font-bold uppercase mt-1 ${m.estado === 'ocupado' ? 'text-red-300' : 'text-emerald-300'}`}>{m.estado}</span>
              </button>
            ))}
            {mesas.length === 0 && <p className="text-center text-slate-500 w-full mt-10">No hay mesas registradas.</p>}
          </div>
        </div>

        {/* PANEL CENTRAL: FILA PENSIONADOS */}
        <div className="glass-panel flex flex-col p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🔴 Fila (Pensionados)</h2>
            <span className="bg-emerald-500 text-slate-900 px-3 py-1 rounded-full font-bold text-xs">{fila.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {fila.map(asistencia => (
              <div key={asistencia.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{asistencia.usuarios?.nombre}</h3>
                    <p className="text-xs text-slate-400"><span className="uppercase text-emerald-400 font-bold">{asistencia.modalidad}</span> | {asistencia.usuarios?.creditos_restantes} cr</p>
                  </div>
                  <button onClick={() => dispensarTicket(asistencia)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 text-sm rounded-lg">
                    Dispensar
                  </button>
                </div>
                <div className="text-xs space-y-1 bg-slate-800 p-2 rounded border border-slate-700/50">
                  <p><span className="text-slate-500 font-bold">Entrada:</span> {asistencia.entrada?.nombre || '-'}</p>
                  <p><span className="text-slate-500 font-bold">Fuerte:</span> {asistencia.fuerte?.nombre || '-'}</p>
                  <p><span className="text-slate-500 font-bold">Postre:</span> {asistencia.postre?.nombre || '-'}</p>
                </div>
              </div>
            ))}
            {fila.length === 0 && <p className="text-center text-slate-500 mt-10">La fila está vacía.</p>}
          </div>
        </div>

        {/* PANEL DERECHO: VENTAS LIBRES */}
        <div className="glass-panel flex flex-col p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4 text-blue-400">🛒 Ventas a No Pensionados</h2>
          
          <div className="flex-1 overflow-y-auto mb-4 border-b border-slate-700 pb-4">
            <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Menú</h3>
            <div className="grid grid-cols-2 gap-2">
              {platos.map(p => (
                <button key={p.id} onClick={() => agregarAlCarrito(p)} className="bg-slate-900 border border-slate-700 p-3 rounded-lg text-left hover:border-blue-500 transition">
                  <span className="block font-medium truncate">{p.nombre}</span>
                  <span className="text-blue-400 text-xs font-bold">Bs. {p.precio_venta_libre}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-60 flex flex-col">
            <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Carrito ({carrito.length} ítems)</h3>
            <div className="flex-1 overflow-y-auto space-y-1 mb-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
              {carrito.map((c, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{c.cantidad}x {c.nombre}</span>
                  <span className="text-emerald-400 font-bold">Bs. {c.precio * c.cantidad}</span>
                </div>
              ))}
              {carrito.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Añade platos para cobrar</p>}
            </div>
            
            <div className="mb-3">
              <select value={mesaVentaLibre} onChange={e => setMesaVentaLibre(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 p-2 rounded-lg text-sm text-white font-bold outline-none focus:border-blue-500">
                <option value="">-- Sin Mesa (Para Llevar) --</option>
                {mesas.map(m => <option key={m.id} value={m.numero}>Asignar a Mesa #{m.numero}</option>)}
              </select>
            </div>

            <button onClick={cobrarVentaLibre} disabled={carrito.length === 0} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg mt-auto transition-transform active:scale-95">
              Cobrar Bs. {totalCarrito}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TICKET FLOTANTE */}
      {ticketActivo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white text-black p-8 w-80 rounded-sm shadow-2xl flex flex-col font-mono">
            <h2 className="text-xl font-bold text-center mb-4">RESTAURANTE GESPE</h2>
            <p className="text-center text-sm border-b border-black pb-2 mb-4">TICKET DE ALMUERZO</p>
            <p><strong>Cliente:</strong> {ticketActivo.usuarios?.nombre}</p>
            <p><strong>Modalidad:</strong> {ticketActivo.modalidad.toUpperCase()}</p>
            <div className="my-4 border-y border-dashed border-gray-400 py-2 space-y-1 text-sm">
              <p>Entrada: {ticketActivo.entrada?.nombre}</p>
              <p>Fuerte: {ticketActivo.fuerte?.nombre}</p>
              <p>Postre: {ticketActivo.postre?.nombre}</p>
            </div>
            <p className="text-center font-bold text-lg my-4">¡ENTREGADO!</p>
            <div className="flex gap-2 mt-4 no-print">
              <button onClick={() => window.print()} className="flex-1 bg-slate-800 text-white py-2 rounded font-sans font-bold">🖨️ Imprimir</button>
              <button onClick={() => setTicketActivo(null)} className="flex-1 bg-red-500 text-white py-2 rounded font-sans font-bold">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TICKET VENTA LIBRE */}
      {ticketLibre && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white text-black p-8 w-80 rounded-sm shadow-2xl flex flex-col font-mono relative">
            <h2 className="text-xl font-bold text-center mb-2">RESTAURANTE GESPE</h2>
            <p className="text-center text-sm border-b border-black pb-2 mb-4">TICKET DE VENTA LIBRE</p>
            
            <p className="mb-1"><strong>Mesa:</strong> {ticketLibre.mesa ? `#${ticketLibre.mesa}` : 'Para Llevar'}</p>
            <p className="text-xs text-gray-600 mb-4">Fecha: {new Date().toLocaleDateString()}</p>
            
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-dashed border-gray-400">
                  <th className="text-left font-normal w-8">Cant</th>
                  <th className="text-left font-normal">Descripción</th>
                  <th className="text-right font-normal">Bs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-gray-200">
                {ticketLibre.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-1">{it.cantidad}</td>
                    <td className="py-1 truncate max-w-[120px]">{it.nombre}</td>
                    <td className="py-1 text-right">{it.precio * it.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="border-t-2 border-black pt-2 flex justify-between font-bold text-lg mb-4">
              <span>TOTAL:</span>
              <span>Bs. {ticketLibre.total.toFixed(2)}</span>
            </div>
            
            <p className="text-center font-bold text-sm mb-4">¡GRACIAS POR SU COMPRA!</p>
            
            <div className="flex gap-2 mt-2 no-print">
              <button onClick={() => window.print()} className="flex-1 bg-slate-800 text-white py-2 rounded font-sans font-bold shadow-lg">🖨️ Imprimir</button>
              <button onClick={() => setTicketLibre(null)} className="flex-1 bg-red-500 text-white py-2 rounded font-sans font-bold shadow-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CIERRE TURNO */}
      {modalCierre && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Cierre de Caja</h2>
            <p className="text-slate-400 mb-6">El sistema registró ventas libres por: <strong className="text-white">Bs. {turno.total_ventas_libres}</strong></p>
            <form onSubmit={cerrarTurno}>
              <label className="block text-sm mb-2 text-slate-300">¿Cuánto dinero en efectivo vas a entregar?</label>
              <input type="number" required step="0.5" value={montoDeclarado} onChange={e => setMontoDeclarado(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-lg text-white mb-6 text-xl text-center" placeholder="0.00" />
              <div className="flex gap-4">
                <button type="button" onClick={() => setModalCierre(false)} className="flex-1 bg-slate-700 py-3 rounded-lg font-bold hover:bg-slate-600">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 py-3 rounded-lg font-bold hover:bg-red-500">Confirmar Cierre</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TICKET RESUMEN DE CIERRE */}
      {ticketCierre && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]">
          <div className="bg-white text-black p-8 w-80 rounded-sm shadow-2xl flex flex-col font-mono relative">
            <h2 className="text-xl font-bold text-center mb-2">REPORTE DE TURNO</h2>
            <p className="text-center text-sm border-b border-black pb-2 mb-4">RESTAURANTE GESPE</p>
            
            <p className="text-xs text-gray-600 mb-1">Apertura: {new Date(ticketCierre.fecha_apertura).toLocaleString()}</p>
            <p className="text-xs text-gray-600 mb-4">Cierre: {new Date(ticketCierre.fecha_cierre).toLocaleString()}</p>
            
            <div className="border-t border-b border-dashed border-gray-400 py-3 mb-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Ventas Sistema:</span>
                <span>Bs. {parseFloat(ticketCierre.total_ventas_libres).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Efectivo Declarado:</span>
                <span>Bs. {parseFloat(ticketCierre.monto_declarado).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Diferencia:</span>
                <span className={ticketCierre.diferencia < 0 ? 'text-red-600' : ''}>
                  Bs. {parseFloat(ticketCierre.diferencia).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-black text-center">
              <p className="font-bold text-sm">Firma del Administrador</p>
              <p className="text-xs text-gray-500 mt-1">Conforme de entrega de caja</p>
            </div>

            <div className="mt-8 pt-8 border-t border-black text-center mb-4">
              <p className="font-bold text-sm">Firma del Cajero</p>
            </div>
            
            <div className="flex gap-2 mt-2 no-print">
              <button onClick={() => window.print()} className="flex-1 bg-slate-800 text-white py-2 rounded font-sans font-bold shadow-lg">🖨️ Imprimir</button>
              <button onClick={() => supabase.auth.signOut()} className="flex-1 bg-red-500 text-white py-2 rounded font-sans font-bold shadow-lg">Finalizar y Salir</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media print { .no-print { display: none; } body * { visibility: hidden; } .bg-white, .bg-white * { visibility: visible; } .bg-white { position: absolute; left: 0; top: 0; } }`}</style>
    </div>
  );
}
