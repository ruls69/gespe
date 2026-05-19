-- ==========================================
-- PROYECTO: GESPE v2.0 (Sistema Integral de Restaurante)
-- ARQUITECTURA COMPLETA
-- ==========================================

-- 1. TIPOS ENUMERADOS
CREATE TYPE tipo_rol AS ENUM ('administrador', 'cajero', 'pensionado');
CREATE TYPE estado_pedido AS ENUM ('pendiente', 'entregado', 'falto');

-- 2. TABLA DE USUARIOS (Extiende auth.users)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    rol tipo_rol NOT NULL DEFAULT 'pensionado',
    creditos_restantes INTEGER NOT NULL DEFAULT 0 CHECK (creditos_restantes >= 0),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GESTIÓN DE MESAS
CREATE TABLE mesas_restaurante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INTEGER UNIQUE NOT NULL,
    estado TEXT DEFAULT 'desocupado' CHECK (estado IN ('ocupado', 'desocupado'))
);

-- 4. MENÚ DINÁMICO (Múltiples Platos)
CREATE TABLE platos_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria TEXT CHECK (categoria IN ('entrada', 'fuerte', 'postre', 'bebida')),
    nombre TEXT NOT NULL,
    precio_venta_libre NUMERIC(10,2) DEFAULT 0.00,
    disponible BOOLEAN DEFAULT true
);

-- 5. ASISTENCIAS (Venta Pensionados)
CREATE TABLE asistencias_pensionados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado estado_pedido NOT NULL DEFAULT 'pendiente',
    modalidad TEXT DEFAULT 'local' CHECK (modalidad IN ('local', 'llevar')),
    seleccion_entrada_id UUID REFERENCES platos_menu(id),
    seleccion_fuerte_id UUID REFERENCES platos_menu(id),
    seleccion_postre_id UUID REFERENCES platos_menu(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, fecha)
);

-- 6. TURNOS DE CAJA
CREATE TABLE caja_turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cajero_id UUID REFERENCES usuarios(id),
    fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
    total_ventas_libres NUMERIC(10,2) DEFAULT 0.00,
    monto_declarado NUMERIC(10,2),
    diferencia NUMERIC(10,2)
);

-- 7. VENTAS LIBRES (No Pensionados)
CREATE TABLE ventas_libres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID REFERENCES caja_turnos(id),
    plato_id UUID REFERENCES platos_menu(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    subtotal NUMERIC(10,2) NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDITORÍA FINANCIERA (Recargas de Crédito)
CREATE TABLE transacciones_financieras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    monto_pagado NUMERIC(10,2) NOT NULL,
    creditos_asignados INTEGER NOT NULL,
    creado_por UUID REFERENCES auth.users(id),
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PROCEDIMIENTOS ALMACENADOS (RPC)
-- ==========================================

-- RPC: Recargar Créditos
CREATE OR REPLACE FUNCTION recargar_creditos(
    p_usuario_id UUID, 
    p_monto_pagado NUMERIC, 
    p_creditos_a_sumar INTEGER
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO transacciones_financieras (usuario_id, monto_pagado, creditos_asignados, creado_por)
    VALUES (p_usuario_id, p_monto_pagado, p_creditos_a_sumar, auth.uid());

    UPDATE usuarios SET creditos_restantes = creditos_restantes + p_creditos_a_sumar 
    WHERE id = p_usuario_id;
    RETURN true;
END;
$$;

-- RPC: Consumir Almuerzo (Cobro Atómico Caja)
CREATE OR REPLACE FUNCTION consumir_almuerzo(p_asistencia_id UUID)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_usuario_id UUID;
    v_creditos INTEGER;
    v_estado_actual estado_pedido;
BEGIN
    SELECT a.usuario_id, a.estado, u.creditos_restantes 
    INTO v_usuario_id, v_estado_actual, v_creditos
    FROM asistencias_pensionados a JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.id = p_asistencia_id FOR UPDATE;

    IF v_estado_actual = 'entregado' THEN RAISE EXCEPTION 'Ticket ya entregado.'; END IF;
    IF v_creditos <= 0 THEN RAISE EXCEPTION 'Saldo insuficiente.'; END IF;

    UPDATE usuarios SET creditos_restantes = creditos_restantes - 1 WHERE id = v_usuario_id;
    UPDATE asistencias_pensionados SET estado = 'entregado' WHERE id = p_asistencia_id;
    RETURN true;
END;
$$;

-- ==========================================
-- SEGURIDAD RLS (Nivel de Fila)
-- ==========================================
CREATE OR REPLACE FUNCTION public.rol_actual() RETURNS tipo_rol AS $$
    SELECT rol FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Habilitar RLS en tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias_pensionados ENABLE ROW LEVEL SECURITY;
ALTER TABLE platos_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas_restaurante ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Todos pueden ver platos" ON platos_menu FOR SELECT USING (true);
CREATE POLICY "Admins gestionan platos" ON platos_menu FOR ALL USING (public.rol_actual() = 'administrador');

CREATE POLICY "Todos pueden ver mesas" ON mesas_restaurante FOR SELECT USING (true);
CREATE POLICY "Staff gestiona mesas" ON mesas_restaurante FOR ALL USING (public.rol_actual() IN ('administrador', 'cajero'));

CREATE POLICY "Pensionados ven sus asistencias" ON asistencias_pensionados FOR SELECT USING (
    auth.uid() = usuario_id OR public.rol_actual() IN ('cajero', 'administrador')
);
CREATE POLICY "Pensionados pueden crear asistencia" ON asistencias_pensionados FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
);
CREATE POLICY "Staff puede editar asistencia" ON asistencias_pensionados FOR UPDATE USING (
    public.rol_actual() IN ('cajero', 'administrador')
);
