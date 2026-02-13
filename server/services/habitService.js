import { getDatabase } from '../config/database.js';
import { DEFAULT_COLOR } from '../config/constants.js';

export class HabitService {
  /**
   * Get all active habits
   */
  static async getAllHabits(userId = 1) {
    const db = await getDatabase();
    const habits = await db.all(
      'SELECT * FROM habits WHERE archived = 0 AND user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return habits;
  }

  /**
   * Get habit by ID
   */
  static async getHabitById(id, userId = 1) {
    const db = await getDatabase();
    const habit = await db.get(
      'SELECT * FROM habits WHERE id = ? AND user_id = ? AND archived = 0',
      [id, userId]
    );

    if (!habit) {
      throw new Error('Habit not found');
    }

    return habit;
  }

  /**
   * Create new habit
   */
  static async createHabit(data, userId = 1) {
    const db = await getDatabase();
    const { name, color = DEFAULT_COLOR } = data;

    if (!name || name.trim().length === 0) {
      throw new Error('Habit name is required');
    }

    const result = await db.run(
      'INSERT INTO habits (name, color, user_id) VALUES (?, ?, ?)',
      [name.trim(), color, userId]
    );

    // Fetch the created habit
    const habit = await db.get(
      'SELECT * FROM habits WHERE id = ?',
      [result.lastID]
    );

    return habit;
  }

  /**
   * Update habit
   */
  static async updateHabit(id, data, userId = 1) {
    const db = await getDatabase();

    // First check if habit exists and belongs to user
    await this.getHabitById(id, userId);

    const updates = [];
    const values = [];

    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new Error('Habit name cannot be empty');
      }
      updates.push('name = ?');
      values.push(data.name.trim());
    }

    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    values.push(userId);

    await db.run(
      `UPDATE habits SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return await this.getHabitById(id, userId);
  }

  /**
   * Delete (archive) habit
   */
  static async deleteHabit(id, userId = 1) {
    const db = await getDatabase();

    // Check if habit exists
    await this.getHabitById(id, userId);

    // Soft delete (archive)
    await db.run(
      'UPDATE habits SET archived = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return { success: true, message: 'Habit archived successfully' };
  }

  /**
   * Get habits with execution stats
   */
  static async getHabitsWithStats(userId = 1) {
    const db = await getDatabase();
    const habits = await db.all(`
      SELECT
        h.*,
        COUNT(e.id) as total_executions,
        MAX(CASE WHEN e.completed = 1 THEN e.date END) as last_completion
      FROM habits h
      LEFT JOIN executions e ON h.id = e.habit_id
      WHERE h.archived = 0 AND h.user_id = ?
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `, [userId]);

    return habits;
  }
}
