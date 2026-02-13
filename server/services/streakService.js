import { getDatabase } from '../config/database.js';
import { formatDate, parseDate, daysAgo } from '../utils/dateHelpers.js';

export class StreakService {
  /**
   * Calculate current and max streak for a habit
   */
  static async calculateStreak(habitId) {
    const db = await getDatabase();

    // Get all completed executions, sorted by date descending
    const executions = await db.all(
      `SELECT date FROM executions
       WHERE habit_id = ? AND completed = 1
       ORDER BY date DESC`,
      [habitId]
    );

    if (executions.length === 0) {
      return { currentStreak: 0, maxStreak: 0, lastCompletion: null };
    }

    const today = formatDate(new Date());
    const yesterday = daysAgo(1);

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let isCurrentActive = false;

    // Check if there's an execution today or yesterday
    const latestDate = executions[0].date;
    if (latestDate === today || latestDate === yesterday) {
      isCurrentActive = true;
    }

    // Calculate streaks
    let previousDate = null;
    for (const execution of executions) {
      const currentDate = execution.date;

      if (previousDate === null) {
        // First execution
        tempStreak = 1;
      } else {
        const prevDateObj = parseDate(previousDate);
        const currDateObj = parseDate(currentDate);
        const daysDiff = (prevDateObj - currDateObj) / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) {
          // Consecutive day
          tempStreak++;
        } else {
          // Gap in streak
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }

      // Update current streak (only if actively maintained)
      if (isCurrentActive && previousDate === null) {
        currentStreak = tempStreak;
      } else if (isCurrentActive && previousDate !== null) {
        const prevDateObj = parseDate(previousDate);
        const currDateObj = parseDate(currentDate);
        const daysDiff = (prevDateObj - currDateObj) / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) {
          currentStreak = tempStreak;
        } else {
          isCurrentActive = false;
        }
      }

      previousDate = currentDate;
    }

    // Final max streak check
    maxStreak = Math.max(maxStreak, tempStreak);

    return {
      currentStreak: isCurrentActive ? currentStreak : 0,
      maxStreak,
      lastCompletion: executions[0].date
    };
  }

  /**
   * Get streaks for all habits
   */
  static async getAllStreaks(userId = 1) {
    const db = await getDatabase();

    const habits = await db.all(
      'SELECT id, name FROM habits WHERE archived = 0 AND user_id = ?',
      [userId]
    );

    const streaks = {};
    for (const habit of habits) {
      streaks[habit.id] = await this.calculateStreak(habit.id);
    }

    return streaks;
  }

  /**
   * Get max streak across all habits
   */
  static async getMaxStreakOverall(userId = 1) {
    const streaks = await this.getAllStreaks(userId);
    let maxStreakValue = 0;
    let maxStreakHabit = null;

    for (const [habitId, streak] of Object.entries(streaks)) {
      if (streak.maxStreak > maxStreakValue) {
        maxStreakValue = streak.maxStreak;
        maxStreakHabit = habitId;
      }
    }

    return { maxStreak: maxStreakValue, habitId: maxStreakHabit };
  }
}
