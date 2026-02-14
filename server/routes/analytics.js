import express from 'express';
import { AnalyticsService } from '../services/analyticsService.js';
import { StreakService } from '../services/streakService.js';

const router = express.Router();

/**
 * GET /api/analytics/overview
 * Get overall statistics
 */
router.get('/overview', async (req, res, next) => {
  try {
    const overview = await AnalyticsService.getOverview(req.userId);
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/habits/:id/stats
 * Get detailed statistics for a specific habit
 */
router.get('/habits/:id/stats', async (req, res, next) => {
  try {
    const stats = await AnalyticsService.getHabitStats(req.params.id, req.userId);
    res.json(stats);
  } catch (error) {
    if (error.message === 'Habit not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/analytics/habits/:id/streak
 * Get streak information for a habit
 */
router.get('/habits/:id/streak', async (req, res, next) => {
  try {
    const streak = await StreakService.calculateStreak(req.params.id);
    res.json(streak);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/streaks
 * Get streaks for all habits
 */
router.get('/streaks', async (req, res, next) => {
  try {
    const streaks = await StreakService.getAllStreaks(req.userId);
    res.json(streaks);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/heatmap
 * Get heatmap data
 * Query params: year (optional, defaults to current year)
 */
router.get('/heatmap', async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const heatmap = await AnalyticsService.getHeatmap(year, req.userId);
    res.json(heatmap);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/weekly-chart
 * Get weekly completion chart data
 */
router.get('/weekly-chart', async (req, res, next) => {
  try {
    const chartData = await AnalyticsService.getWeeklyChart(req.userId);
    res.json(chartData);
  } catch (error) {
    next(error);
  }
});

export default router;
