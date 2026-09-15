/*
  # Políticas de administración para admin_users (ADMIN-07)

  Permite que los administradores autorizados (is_admin() = true) puedan:
  - Listar los administradores (SELECT)
  - Autorizar nuevos correos de administradores (INSERT)
  - Revocar accesos de administradores (DELETE)
*/

-- Políticas de escritura para admin_users
create policy "admin_users: el equipo puede agregar administradores"
  on admin_users for insert
  to authenticated
  with check (is_admin());

create policy "admin_users: el equipo puede eliminar administradores"
  on admin_users for delete
  to authenticated
  using (is_admin());

create policy "admin_users: el equipo puede actualizar administradores"
  on admin_users for update
  to authenticated
  using (is_admin())
  with check (is_admin());
