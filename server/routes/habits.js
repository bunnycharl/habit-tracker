import express from 'express';
import { HabitService } from '../services/habitService.js';

const router = express.Router();

/**
 * GET /api/habits
 * Get all active habits
 */
router.get('/', async (req, res, next) => {
  try {
    const habits = await HabitService.getAllHabits(req.userId);
    res.json(habits);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/habits/stats
 * Get all habits with statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const habits = await HabitService.getHabitsWithStats(req.userId);
    res.json(habits);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/habits/:id
 * Get habit by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const habit = await HabitService.getHabitById(req.params.id, req.userId);
    res.json(habit);
  } catch (error) {
    if (error.message === 'Habit not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

/**
 * POST /api/habits
 * Create new habit
 */
router.post('/', async (req, res, next) => {
  try {
    const habit = await HabitService.createHabit(req.body, req.userId);
    res.status(201).json(habit);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('cannot be empty')) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

/**
 * PUT /api/habits/:id
 * Update habit
 */
router.put('/:id', async (req, res, next) => {
  try {
    const habit = await HabitService.updateHabit(req.params.id, req.body, req.userId);
    res.json(habit);
  } catch (error) {
    if (error.message === 'Habit not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('cannot be empty') || error.message.includes('No valid fields')) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/habits/:id
 * Archive habit
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await HabitService.deleteHabit(req.params.id, req.userId);
    res.json(result);
  } catch (error) {
    if (error.message === 'Habit not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

export default router;
