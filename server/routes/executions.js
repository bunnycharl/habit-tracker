import express from 'express';
import { ExecutionService } from '../services/executionService.js';

const router = express.Router();

/**
 * GET /api/executions
 * Get executions with optional filters
 * Query params: habit_id, start_date, end_date, date
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      habit_id: req.query.habit_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      date: req.query.date
    };

    const executions = await ExecutionService.getExecutions(filters);
    res.json(executions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/executions/today
 * Get today's executions
 */
router.get('/today', async (req, res, next) => {
  try {
    const executions = await ExecutionService.getTodayExecutions();
    res.json(executions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/executions/habits-status
 * Get all habits with today's completion status
 */
router.get('/habits-status', async (req, res, next) => {
  try {
    const habits = await ExecutionService.getHabitsWithTodayStatus();
    res.json(habits);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/executions
 * Create new execution
 */
router.post('/', async (req, res, next) => {
  try {
    const execution = await ExecutionService.createExecution(req.body);
    res.status(201).json(execution);
  } catch (error) {
    if (error.message === 'Habit not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('required') || error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

/**
 * POST /api/executions/toggle
 * Toggle execution (create or delete)
 */
router.post('/toggle', async (req, res, next) => {
  try {
    const { habit_id, date = new Date().toISOString().split('T')[0] } = req.body;

    if (!habit_id) {
      return res.status(400).json({ error: 'habit_id is required' });
    }

    const result = await ExecutionService.toggleExecution(habit_id, date);
    res.json(result);
  } catch (error) {
    if (error.message === 'Habit not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/executions/:habitId/:date
 * Delete specific execution
 */
router.delete('/:habitId/:date', async (req, res, next) => {
  try {
    const result = await ExecutionService.deleteExecution(
      req.params.habitId,
      req.params.date
    );
    res.json(result);
  } catch (error) {
    if (error.message === 'Habit not found' || error.message === 'Execution not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

export default router;
