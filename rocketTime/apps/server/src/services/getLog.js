import db from './db.js'; // import database

//get one user' log
export async function getTimeLogs(userId){
    try{
        const rows = await db.query(
            `SELECT id, goal_id, date, duration_hr, category, title
             FROM timelogs
             WHERE user_id = ?`,
            [userId]
        );

        // if no logs found
        if (!rows.length) {
            return { message: 'User had no timelogs' };
        }

        return { timelogs: rows };

    } catch(err){
        console.error('Error getting time logs: ', err);
        throw err;
    }
}

export default getTimeLogs;