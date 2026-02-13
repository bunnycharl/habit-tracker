import { getDatabase } from '../config/database.js';
import { StreakService } from './streakService.js';
import {
  formatDate,
  daysAgo,
  getYearStart,
  getYearEnd,
  getDateRange
} from '../utils/dateHelpers.js';

export class AnalyticsService {
  /**
   * Get overview statistics
   */
  static async getOverview(userId = 1) {
    const db = await getDatabase();

    // Total executions
    const totalResult = await db.get(`
      SELECT COUNT(e.id) as total
      FROM executions e
      JOIN habits h ON e.habit_id = h.id
      WHERE h.user_id = ? AND e.completed = 1
    `, [userId]);

    // Active habits count
    const habitsResult = await db.get(
      'SELECT COUNT(*) as count FROM habits WHERE archived = 0 AND user_id = ?',
      [userId]
    );

    // Today's stats
    const today = formatDate(new Date());
    const todayResult = await db.get(`
      SELECT
        COUNT(DISTINCT e.habit_id) as completed,
        (SELECT COUNT(*) FROM habits WHERE archived = 0 AND user_id = ?) as total
      FROM executions e
      JOIN habits h ON e.habit_id = h.id
      WHERE e.date = ? AND h.user_id = ?
    `, [userId, today, userId]);

    // Max streak
    const maxStreakData = await StreakService.getMaxStreakOverall(userId);

    // Completion rate (last 30 days)
    const thirtyDaysAgo = daysAgo(30);
    const completionResult = await db.get(`
      SELECT
        COUNT(e.id) as completions,
        (SELECT COUNT(*) FROM habits WHERE archived = 0 AND user_id = ?) * 30 as possible
      FROM executions e
      JOIN habits h ON e.habit_id = h.id
      WHERE e.date >= ? AND e.completed = 1 AND h.user_id = ?
    `, [userId, thirtyDaysAgo, userId]);

    const completionRate = completionResult.possible > 0
      ? completionResult.completions / completionResult.possible
      : 0;

    // Weekly trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = daysAgo(i);
      const dayResult = await db.get(`
        SELECT
          COUNT(DISTINCT e.habit_id) as completed,
          (SELECT COUNT(*) FROM habits WHERE archived = 0 AND user_id = ?) as total
        FROM executions e
        JOIN habits h ON e.habit_id = h.id
        WHERE e.date = ? AND h.user_id = ?
      `, [userId, date, userId]);

      const rate = dayResult.total > 0 ? dayResult.completed / dayResult.total : 0;
      weeklyTrend.push(rate);
    }

    // Efficiency (days with at least one completion)
    const firstHabitResult = await db.get(
      'SELECT MIN(created_at) as first_date FROM habits WHERE user_id = ?',
      [userId]
    );

    let efficiency = 0;
    if (firstHabitResult.first_date) {
      const firstDate = firstHabitResult.first_date.split('T')[0];
      const daysResult = await db.get(`
        SELECT COUNT(DISTINCT e.date) as active_days
        FROM executions e
        JOIN habits h ON e.habit_id = h.id
        WHERE e.date >= ? AND e.completed = 1 AND h.user_id = ?
      `, [firstDate, userId]);

      const totalDays = Math.ceil((new Date() - new Date(firstDate)) / (1000 * 60 * 60 * 24)) + 1;
      efficiency = totalDays > 0 ? daysResult.active_days / totalDays : 0;
    }

    return {
      total_executions: totalResult.total || 0,
      max_streak: maxStreakData.maxStreak,
      completion_rate: Math.round(completionRate * 100) / 100,
      active_habits: habitsResult.count || 0,
      today_completed: todayResult.completed || 0,
      today_total: todayResult.total || 0,
      weekly_trend: weeklyTrend,
      efficiency: Math.round(efficiency * 100) / 100
    };
  }

  /**
   * Get detailed statistics for a specific habit
   */
  static async getHabitStats(habitId, userId = 1) {
    const db = await getDatabase();

    // Verify habit belongs to user
    const habit = await db.get(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );

    if (!habit) {
      throw new Error('Habit not found');
    }

    // Total completions
    const totalResult = await db.get(
      'SELECT COUNT(*) as total FROM executions WHERE habit_id = ? AND completed = 1',
      [habitId]
    );

    // Streak data
    const streakData = await StreakService.calculateStreak(habitId);

    // Days since creation
    const createdDate = habit.created_at.split('T')[0];
    const daysSinceCreation = Math.ceil(
      (new Date() - new Date(createdDate)) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Completion rate
    const completionRate = daysSinceCreation > 0
      ? (totalResult.total || 0) / daysSinceCreation
      : 0;

    // Best week (7 consecutive days with most completions)
    const sevenDaysAgo = daysAgo(7);
    const recentCompletions = await db.get(
      'SELECT COUNT(*) as count FROM executions WHERE habit_id = ? AND date >= ? AND completed = 1',
      [habitId, sevenDaysAgo]
    );

    return {
      habit_id: habitId,
      habit_name: habit.name,
      habit_color: habit.color,
      total_completions: totalResult.total || 0,
      current_streak: streakData.currentStreak,
      max_streak: streakData.maxStreak,
      last_completion: streakData.lastCompletion,
      days_since_creation: daysSinceCreation,
      completion_rate: Math.round(completionRate * 100) / 100,
      last_7_days: recentCompletions.count || 0
    };
  }

  /**
   * Get heatmap data for a year
   */
  static async getHeatmap(year = new Date().getFullYear(), userId = 1) {
    const db = await getDatabase();

    const startDate = getYearStart(year);
    const endDate = getYearEnd(year);

    // Get all executions for the year
    const executions = await db.all(`
      SELECT e.date, COUNT(DISTINCT e.habit_id) as habits_completed
      FROM executions e
      JOIN habits h ON e.habit_id = h.id
      WHERE e.date BETWEEN ? AND ?
        AND e.completed = 1
        AND h.user_id = ?
      GROUP BY e.date
    `, [startDate, endDate, userId]);

    // Get total habits count for each date (to calculate completion rate)
    const totalHabitsResult = await db.get(
      'SELECT COUNT(*) as count FROM habits WHERE archived = 0 AND user_id = ?',
      [userId]
    );
    const totalHabits = totalHabitsResult.count || 1; // Avoid division by zero

    // Create a map for quick lookup
    const executionMap = {};
    executions.forEach(exec => {
      executionMap[exec.date] = {
        habits_completed: exec.habits_completed,
        completion_rate: exec.habits_completed / totalHabits
      };
    });

    // Generate all dates in the year
    const allDates = getDateRange(startDate, endDate);

    // Build heatmap data
    const heatmapData = allDates.map(date => {
      const data = executionMap[date];
      return {
        date,
        habits_completed: data ? data.habits_completed : 0,
        total_habits: totalHabits,
        completion_rate: data ? Math.round(data.completion_rate * 100) / 100 : 0
      };
    });

    return {
      year,
      start_date: startDate,
      end_date: endDate,
      data: heatmapData
    };
  }

  /**
   * Get weekly completion chart data
   */
  static async getWeeklyChart(userId = 1) {
    const db = await getDatabase();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = daysAgo(i);
      const result = await db.get(`
        SELECT
          COUNT(DISTINCT e.habit_id) as completed,
          (SELECT COUNT(*) FROM habits WHERE archived = 0 AND user_id = ?) as total
        FROM executions e
        JOIN habits h ON e.habit_id = h.id
        WHERE e.date = ? AND e.completed = 1 AND h.user_id = ?
      `, [userId, date, userId]);

      weekData.push({
        date,
        completed: result.completed || 0,
        total: result.total || 0,
        rate: result.total > 0 ? Math.round((result.completed / result.total) * 100) / 100 : 0
      });
    }

    return weekData;
  }
}
