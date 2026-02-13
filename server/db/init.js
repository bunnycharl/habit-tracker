import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('🚀 Initializing database...');

  try {
    const db = await getDatabase();

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await db.run(statement);
    }

    console.log('✅ Database initialized successfully');
    console.log('📊 Tables created: habits, executions');
    console.log('📈 View created: habit_stats');

    // Insert sample data for demonstration
    const sampleHabits = [
      { name: 'Read 30 mins', color: '#6CEFA0' },
      { name: 'Hydration', color: '#6CDDEF' },
      { name: 'Code Review', color: '#B06CEF' },
      { name: 'Meditation', color: '#EF9B6C' }
    ];

    console.log('\n📝 Adding sample habits...');
    for (const habit of sampleHabits) {
      await db.run(
        'INSERT INTO habits (name, color) VALUES (?, ?)',
        [habit.name, habit.color]
      );
    }

    // Add some sample executions
    const today = new Date().toISOString().split('T')[0];
    await db.run('INSERT INTO executions (habit_id, date) VALUES (2, ?)', [today]);

    console.log('✅ Sample data added');
    console.log('\n🎉 Database setup complete!');

    await db.close();
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}

export { initDatabase };
