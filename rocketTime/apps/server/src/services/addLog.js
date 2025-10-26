import db from './db.js'; // import database

//get one user' log
export async function addTimeLogs(userId){
    try{
        const rows = await db.query(
            ` INSERT INTO timelogs(user_id, goal_id, date, duration_hr, category, title)
      VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, goal_id, date, duration_hr, category, title]
        );

        // if no logs found
        if (!rows.length) {
            return { message: 'Time log added successfully' };
        }

        return { timelogs: rows };

    } catch(err){
        console.error('Error adding time logs: ', err);
        throw err;
    }
}

export default getTimeLogs;