-- ========================================================================================
-- Migración de ajustes sobre el esquema tanques/bombas/turnos ya aplicado a mano
-- en el SQL Editor. No modifica el esquema anterior: lo corrige y lo completa.
-- ========================================================================================

BEGIN;

-- ----------------------------------------------------------------------------------------
-- 0. Limpieza defensiva de objetos del esquema anterior (surtidores/vista_surtidores),
--    por si esa migración llegó a aplicarse antes de correr este esquema nuevo.
--    Es inofensivo si nunca existieron (IF EXISTS).
-- ----------------------------------------------------------------------------------------
DROP VIEW IF EXISTS public.vista_surtidores CASCADE;
DROP TABLE IF EXISTS public.surtidores CASCADE;
DROP FUNCTION IF EXISTS public.fn_decodificar_combustible(smallint);
DROP FUNCTION IF EXISTS public.fn_decodificar_nivel(smallint);

-- ----------------------------------------------------------------------------------------
-- 1. Corrige monitorear_nivel_tanque():
--    a) Los umbrales originales eran 75/50/20; la consigna pide 76-100 / 26-75 / 11-25 / 0-10.
--    b) Antes solo corría en UPDATE de volumen_actual -> por eso 2 de los 4 registros
--       semilla quedaron con un nivel_binario que no correspondía a su propio porcentaje
--       (especial 75% se guardó como Lleno, debería ser Medio; premium 30% se guardó como
--       Bajo, debería ser Medio). Ahora corre también en INSERT, así nivel_binario nunca
--       se asigna a mano y no puede volver a desincronizarse.
--    c) Ahora también resuelve alertas que dejan de aplicar y evita abrir alertas
--       duplicadas del mismo tipo para el mismo tanque.
-- ----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION monitorear_nivel_tanque() RETURNS TRIGGER AS $$
DECLARE
  porcentaje NUMERIC;
  nuevo_nivel SMALLINT;
  nivel_previo SMALLINT;
BEGIN
  porcentaje := (NEW.volumen_actual / NEW.capacidad_maxima) * 100;

  -- Umbrales alineados a la consigna: 0-10 / 11-25 / 26-75 / 76-100
  IF porcentaje > 75 THEN nuevo_nivel := 3;       -- 11 Lleno
  ELSIF porcentaje > 25 THEN nuevo_nivel := 2;    -- 10 Medio
  ELSIF porcentaje > 10 THEN nuevo_nivel := 1;    -- 01 Bajo
  ELSE nuevo_nivel := 0;                          -- 00 Vacío / Crítico
  END IF;

  NEW.nivel_binario := nuevo_nivel;
  nivel_previo := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.nivel_binario END;

  IF TG_OP = 'UPDATE' THEN
    -- Resuelve alertas previas que ya no correspondan al nuevo nivel
    UPDATE public.alertas
       SET resuelta = true
     WHERE tanque_id = NEW.id
       AND resuelta = false
       AND NOT (
             (tipo = 'LED_ROJO' AND nuevo_nivel = 0)
          OR (tipo = 'LED_AMARILLO' AND nuevo_nivel = 1)
           );
  END IF;

  IF nivel_previo IS DISTINCT FROM nuevo_nivel THEN
    IF nuevo_nivel = 0 AND NOT EXISTS (
      SELECT 1 FROM public.alertas WHERE tanque_id = NEW.id AND tipo = 'LED_ROJO' AND resuelta = false
    ) THEN
      INSERT INTO public.alertas (tanque_id, tipo, mensaje)
      VALUES (NEW.id, 'LED_ROJO', 'Nivel CRÍTICO. Volumen en 0-10% de la capacidad.');
    ELSIF nuevo_nivel = 1 AND NOT EXISTS (
      SELECT 1 FROM public.alertas WHERE tanque_id = NEW.id AND tipo = 'LED_AMARILLO' AND resuelta = false
    ) THEN
      INSERT INTO public.alertas (tanque_id, tipo, mensaje)
      VALUES (NEW.id, 'LED_AMARILLO', 'Nivel BAJO. Volumen en 11-25% de la capacidad.');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_monitorear_tanque ON public.tanques;
CREATE TRIGGER trg_monitorear_tanque
  BEFORE INSERT OR UPDATE OF volumen_actual, capacidad_maxima ON public.tanques
  FOR EACH ROW EXECUTE PROCEDURE monitorear_nivel_tanque();

-- ----------------------------------------------------------------------------------------
-- 2. "total" solo se calculaba en el INSERT. En vez de perseguir el recálculo si alguien
--    edita litros/precio_unitario después (lo que además dejaría el inventario ya
--    descontado desincronizado), lo más correcto es volver inmutables esos campos:
--    una venta ya registrada no se edita, se anula (estado = 'anulada') y se hace una nueva.
-- ----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION bloquear_edicion_venta() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.litros IS DISTINCT FROM OLD.litros
     OR NEW.precio_unitario IS DISTINCT FROM OLD.precio_unitario
     OR NEW.bomba_id IS DISTINCT FROM OLD.bomba_id THEN
    RAISE EXCEPTION 'Una venta ya registrada no se edita. Anúlala (estado = anulada) y crea una nueva.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloquear_edicion_venta ON public.ventas;
CREATE TRIGGER trg_bloquear_edicion_venta
  BEFORE UPDATE ON public.ventas
  FOR EACH ROW EXECUTE PROCEDURE bloquear_edicion_venta();

-- ----------------------------------------------------------------------------------------
-- 3. RLS: auditoria_logs, perfiles, clientes, bombas, turnos y alertas tenían (o les
--    faltaba activar) Row Level Security SIN ninguna política. Con RLS activo y cero
--    políticas, Postgres deniega todo por defecto: ni el propio dashboard puede leerlas
--    desde la app (solo el rol dueño/superusuario del SQL Editor podía).
-- ----------------------------------------------------------------------------------------

-- auditoria_logs no tenía RLS activado en absoluto -> era de lectura/escritura abierta
-- vía API para cualquier rol con privilegios por defecto. Un log de auditoría debe ser
-- de solo lectura para administradores, y solo el trigger (SECURITY DEFINER) escribe en él.
ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_auditoria ON public.auditoria_logs FOR SELECT USING (is_admin());

-- perfiles: cada quien ve su propio perfil; el admin ve y edita todos.
-- No hay policy de INSERT a propósito: solo handle_new_user() (SECURITY DEFINER) crea perfiles.
CREATE POLICY select_perfiles ON public.perfiles
  FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY update_perfiles_admin ON public.perfiles
  FOR UPDATE USING (is_admin());

-- clientes: cualquier autenticado puede consultarlos/registrarlos; solo admin edita/borra.
CREATE POLICY select_clientes ON public.clientes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY insert_clientes ON public.clientes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY update_clientes ON public.clientes FOR UPDATE USING (is_admin());
CREATE POLICY delete_clientes ON public.clientes FOR DELETE USING (is_admin());

-- bombas: lectura para cualquier autenticado; alta/edición/baja solo admin.
CREATE POLICY select_bombas ON public.bombas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY insert_bombas ON public.bombas FOR INSERT WITH CHECK (is_admin());
CREATE POLICY update_bombas ON public.bombas FOR UPDATE USING (is_admin());
CREATE POLICY delete_bombas ON public.bombas FOR DELETE USING (is_admin());

-- turnos: un operador abre y cierra su propio turno; admin ve y gestiona todos.
CREATE POLICY select_turnos ON public.turnos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY insert_turnos ON public.turnos FOR INSERT WITH CHECK (operador_id = auth.uid());
CREATE POLICY update_turnos ON public.turnos FOR UPDATE USING (operador_id = auth.uid() OR is_admin());

-- alertas: cualquier autenticado las ve y puede marcarlas como resueltas (tarea operativa);
-- el INSERT normal lo hace el trigger (SECURITY DEFINER); se deja además una vía de admin.
CREATE POLICY select_alertas ON public.alertas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY update_alertas ON public.alertas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY insert_alertas ON public.alertas FOR INSERT WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------------------
-- 4. Recalcula (vía el trigger ya corregido, no a mano) los 2 tanques del seed cuyo
--    nivel_binario no correspondía a su propio porcentaje.
-- ----------------------------------------------------------------------------------------
UPDATE public.tanques
   SET volumen_actual = volumen_actual
 WHERE combustible IN ('especial', 'premium');

COMMIT;

-- Verificación rápida después de aplicar:
--   select combustible, volumen_actual, capacidad_maxima, nivel_binario from public.tanques;
--   -- especial (75%) y premium (30%) deben quedar en nivel_binario = 2 (Medio)
--   select * from public.alertas where resuelta = false;
