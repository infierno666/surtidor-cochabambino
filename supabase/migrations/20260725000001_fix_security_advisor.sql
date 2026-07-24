-- ========================================================================================
-- Corrige los hallazgos del Security/Performance Advisor de Supabase:
--   A) 2 vistas con SECURITY DEFINER (crítico) -> pasan a SECURITY INVOKER
--   B) auth_rls_initplan: auth.uid()/auth.role()/is_admin() sin envolver en (select ...)
--      en TODAS las políticas ya creadas -> se recrean optimizadas
-- ========================================================================================

BEGIN;

-- ----------------------------------------------------------------------------------------
-- A. Vistas: que respeten el RLS de quien consulta, no el del dueño
-- ----------------------------------------------------------------------------------------
ALTER VIEW public.vista_dashboard_hoy SET (security_invoker = true);
ALTER VIEW public.vista_inventario_actual SET (security_invoker = true);

-- ----------------------------------------------------------------------------------------
-- B. Políticas RLS: se reemplaza auth.uid() / auth.role() / is_admin() por (select ...)
--    para que Postgres las evalúe una sola vez por consulta, no por fila.
-- ----------------------------------------------------------------------------------------

-- ventas
DROP POLICY IF EXISTS select_ventas ON public.ventas;
CREATE POLICY select_ventas ON public.ventas FOR SELECT USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS insert_ventas ON public.ventas;
CREATE POLICY insert_ventas ON public.ventas FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS update_ventas ON public.ventas;
CREATE POLICY update_ventas ON public.ventas FOR UPDATE USING ((select is_admin()));

DROP POLICY IF EXISTS delete_ventas ON public.ventas;
CREATE POLICY delete_ventas ON public.ventas FOR DELETE USING ((select is_admin()));

-- tanques
DROP POLICY IF EXISTS select_tanques ON public.tanques;
CREATE POLICY select_tanques ON public.tanques FOR SELECT USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS update_tanques ON public.tanques;
CREATE POLICY update_tanques ON public.tanques FOR UPDATE USING ((select is_admin()));

DROP POLICY IF EXISTS insert_tanques ON public.tanques;
CREATE POLICY insert_tanques ON public.tanques FOR INSERT WITH CHECK ((select is_admin()));

DROP POLICY IF EXISTS delete_tanques ON public.tanques;
CREATE POLICY delete_tanques ON public.tanques FOR DELETE USING ((select is_admin()));

-- auditoria_logs
DROP POLICY IF EXISTS select_auditoria ON public.auditoria_logs;
CREATE POLICY select_auditoria ON public.auditoria_logs FOR SELECT USING ((select is_admin()));

-- perfiles
DROP POLICY IF EXISTS select_perfiles ON public.perfiles;
CREATE POLICY select_perfiles ON public.perfiles
  FOR SELECT USING (id = (select auth.uid()) OR (select is_admin()));

DROP POLICY IF EXISTS update_perfiles_admin ON public.perfiles;
CREATE POLICY update_perfiles_admin ON public.perfiles FOR UPDATE USING ((select is_admin()));

-- clientes
DROP POLICY IF EXISTS select_clientes ON public.clientes;
CREATE POLICY select_clientes ON public.clientes FOR SELECT USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS insert_clientes ON public.clientes;
CREATE POLICY insert_clientes ON public.clientes FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS update_clientes ON public.clientes;
CREATE POLICY update_clientes ON public.clientes FOR UPDATE USING ((select is_admin()));

DROP POLICY IF EXISTS delete_clientes ON public.clientes;
CREATE POLICY delete_clientes ON public.clientes FOR DELETE USING ((select is_admin()));

-- bombas
DROP POLICY IF EXISTS select_bombas ON public.bombas;
CREATE POLICY select_bombas ON public.bombas FOR SELECT USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS insert_bombas ON public.bombas;
CREATE POLICY insert_bombas ON public.bombas FOR INSERT WITH CHECK ((select is_admin()));

DROP POLICY IF EXISTS update_bombas ON public.bombas;
CREATE POLICY update_bombas ON public.bombas FOR UPDATE USING ((select is_admin()));

DROP POLICY IF EXISTS delete_bombas ON public.bombas;
CREATE POLICY delete_bombas ON public.bombas FOR DELETE USING ((select is_admin()));

-- turnos
DROP POLICY IF EXISTS select_turnos ON public.turnos;
CREATE POLICY select_turnos ON public.turnos FOR SELECT USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS insert_turnos ON public.turnos;
CREATE POLICY insert_turnos ON public.turnos FOR INSERT WITH CHECK (operador_id = (select auth.uid()));

DROP POLICY IF EXISTS update_turnos ON public.turnos;
CREATE POLICY update_turnos ON public.turnos
  FOR UPDATE USING (operador_id = (select auth.uid()) OR (select is_admin()));

-- alertas
DROP POLICY IF EXISTS select_alertas ON public.alertas;
CREATE POLICY select_alertas ON public.alertas FOR SELECT USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS update_alertas ON public.alertas;
CREATE POLICY update_alertas ON public.alertas FOR UPDATE USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS insert_alertas ON public.alertas;
CREATE POLICY insert_alertas ON public.alertas FOR INSERT WITH CHECK ((select is_admin()));

COMMIT;

-- Verificación: vuelve a correr el Advisor (Security + Performance) en el dashboard de
-- Supabase; las 2 alertas "Security Definer View" y todas las "Auth RLS Initialization
-- Plan" deberían desaparecer. Si el dashboard tarda en refrescar, dale a "Rerun linter".
