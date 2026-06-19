export function createUserRepository(pool) {
  return {
    async createUser({ email, passwordHash }) {
      const result = await pool.query(
        `insert into public.users (email, password_hash)
         values ($1, $2)
         returning id, email, created_at`,
        [email, passwordHash]
      );
      return result.rows[0];
    },

    async findByEmail(email) {
      const result = await pool.query(
        `select id, email, password_hash, created_at
         from public.users
         where email = $1`,
        [email]
      );
      return result.rows[0] ?? null;
    },

    async findById(id) {
      const result = await pool.query(
        `select id, email, created_at
         from public.users
         where id = $1`,
        [id]
      );
      return result.rows[0] ?? null;
    }
  };
}
