export function createProjectRepository(pool) {
  return {
    async listByUser(userId) {
      const result = await pool.query(
        `select id, project_name, category_id, created_at, updated_at
         from public.projects
         where user_id = $1
         order by updated_at desc`,
        [userId]
      );
      return result.rows;
    },

    async createProject({ userId, projectName, categoryId, formData, assessment, drafts }) {
      const result = await pool.query(
        `insert into public.projects (user_id, project_name, category_id, form_data, assessment, drafts)
         values ($1, $2, $3, $4, $5, $6)
         returning *`,
        [userId, projectName, categoryId, formData, assessment, drafts]
      );
      return result.rows[0];
    },

    async findByIdForUser({ projectId, userId }) {
      const result = await pool.query(
        `select *
         from public.projects
         where id = $1 and user_id = $2`,
        [projectId, userId]
      );
      return result.rows[0] ?? null;
    },

    async updateProject({ projectId, userId, projectName, categoryId, formData, assessment, drafts }) {
      const result = await pool.query(
        `update public.projects
         set project_name = $3,
             category_id = $4,
             form_data = $5,
             assessment = $6,
             drafts = $7
         where id = $1 and user_id = $2
         returning *`,
        [projectId, userId, projectName, categoryId, formData, assessment, drafts]
      );
      return result.rows[0] ?? null;
    }
  };
}
