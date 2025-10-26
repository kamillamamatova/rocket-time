import db from './db.js'; // import database

export async function deleteGoal(timelog_Id){
  try {
    
    const result = await db.query(
        'DELETE FROM goals WHERE id = ?', 
        [timelog_Id]);
    
    if (result.affectedRows === 0) {
      return { error: 'Goal not found' };
    }
    
    return{ message: 'Goal deleted successfully' };
  } catch (err) {
    console.error('Delete goal error:', err);
    throw err
  }
};

export default deleteGoal;