import { getDatabase } from '../config/database.js';
import { HabitService } from './habitService.js';

export class ExecutionService {
  /**
   * Get all executions with optional filters
   */
  static async getExecutions(filters = {}, userId = 1) {
    const db = await getDatabase();
    const { habit_id, start_date, end_date, date } = filters;

    let query = `
      SELECT e.*, h.name as habit_name, h.color as habit_color
      FROM executions e
      JOIN habits h ON e.habit_id = h.id
      WHERE h.user_id = ?
    `;
    const params = [userId];

    if (habit_id) {
      query += ' AND e.habit_id = ?';
      params.push(habit_id);
    }

    if (date) {
      query += ' AND e.date = ?';
      params.push(date);
    } else {
      if (start_date) {
        query += ' AND e.date >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND e.date <= ?';
        params.push(end_date);
      }
    }

    query += ' ORDER BY e.date DESC';

    const executions = await db.all(query, params);
    return executions;
  }

  /**
   * Get executions for today
   */
  static async getTodayExecutions(userId = 1) {
    const today = new Date().toISOString().split('T')[0];
    return await this.getExecutions({ date: today }, userId);
  }

  /**
   * Toggle execution (mark as completed or uncompleted)
   */
  static async toggleExecution(habitId, date, userId = 1) {
    const db = await getDatabase();

    // Verify habit exists and belongs to user
    await HabitService.getHabitById(habitId, userId);

    // Check if execution already exists
    const existing = await db.get(
      'SELECT * FROM executions WHERE habit_id = ? AND date = ?',
      [habitId, date]
    );

    if (existing) {
      // Delete the execution (toggle off)
      await db.run(
        'DELETE FROM executions WHERE habit_id = ? AND date = ?',
        [habitId, date]
      );
      return { completed: false, action: 'removed' };
    } else {
      // Create new execution (toggle on)
      await db.run(
        'INSERT INTO executions (habit_id, date, completed) VALUES (?, ?, 1)',
        [habitId, date]
      );
      return { completed: true, action: 'created' };
    }
  }

  /**
   * Mark habit as completed for a specific date
   */
  static async createExecution(data, userId = 1) {
    const db = await getDatabase();
    const { habit_id, date = new Date().toISOString().split('T')[0] } = data;

    if (!habit_id) {
      throw new Error('habit_id is required');
    }

    // Verify habit exists and belongs to user
    await HabitService.getHabitById(habit_id, userId);

    try {
      const result = await db.run(
        'INSERT INTO executions (habit_id, date, completed) VALUES (?, ?, 1)',
        [habit_id, date]
      );

      const execution = await db.get(
        'SELECT * FROM executions WHERE id = ?',
        [result.lastID]
      );

      return execution;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        throw new Error('Execution already exists for this date');
      }
      throw error;
    }
  }

  /**
   * Delete execution
   */
  static async deleteExecution(habitId, date, userId = 1) {
    const db = await getDatabase();

    // Verify habit belongs to user
    await HabitService.getHabitById(habitId, userId);

    const result = await db.run(
      'DELETE FROM executions WHERE habit_id = ? AND date = ?',
      [habitId, date]
    );

    if (result.changes === 0) {
      throw new Error('Execution not found');
    }

    return { success: true, message: 'Execution deleted successfully' };
  }

  /**
   * Get habits with today's execution status
   */
  static async getHabitsWithTodayStatus(userId = 1) {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const habits = await db.all(`
      SELECT
        h.*,
        CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END as completed_today
      FROM habits h
      LEFT JOIN executions e ON h.id = e.habit_id AND e.date = ?
      WHERE h.archived = 0 AND h.user_id = ?
      ORDER BY h.created_at DESC
    `, [today, userId]);

    return habits;
  }
}
