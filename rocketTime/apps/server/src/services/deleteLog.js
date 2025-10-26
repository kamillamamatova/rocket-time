import db from './db.js'; // import database

export async function deleteTimeLogs(timelog_Id){
  try {
    
    const result = await db.query(
        'DELETE FROM timelogs WHERE id = ?', 
        [timelog_Id]);
    
    if (result.affectedRows === 0) {
      return { error: 'Time log not found' };
    }
    
    return{ message: 'Time log deleted successfully' };
  } catch (err) {
    console.error('Delete timelog error:', err);
    throw err
  }
};

export default deleteTimeLogs;