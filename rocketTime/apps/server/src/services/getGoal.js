import db from './db.js';

export async function getGoalLogs(user_Id){
    try{
        const rows = await db.query(
            `SELECT id, title, target_hours, category, deadline, progress_hours, status
             FROM goals
             WHERE user_id = ?`,
            [user_Id]
        );

        // if no logs found
        if (!rows.length) {
            return { message: 'User had no goal logs' };
        }

        return { goals: rows };

    } catch(err){
        console.error('Error getting goal logs: ', err);
        throw err;
    }
};