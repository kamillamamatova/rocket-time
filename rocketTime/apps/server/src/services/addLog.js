import db from './db.js'; // import database

//get one user' log
export async function addTimeLogs(logbody){
    try{
        const date=new Date(logbody.date);
        const mysqldate=date.toISOString().slice(0,19).replace("T", " ");
        const result = await db.query(
            ` INSERT INTO timelogs(user_id, goal_id, date, duration_hr, category, title)
      VALUES (?, ?, ?, ?, ?, ?)`,
            [logbody.user_id, logbody.goal_id, mysqldate, 
                logbody.duration_hr, logbody.category, 
                logbody.title]
        );
        if(logbody.goal_id){
            await db.query(
           `UPDATE goals
            SET 
            progress_hours = progress_hours + ?,
            status = CASE
                WHEN progress_hours + ? >= target_hours THEN 'completed'
                WHEN status = 'not started' THEN 'in progress'
                ELSE status
            END
            WHERE id = ? AND user_id = ?`,
            [logbody.duration_hr, logbody.duration_hr, logbody.goal_id, logbody.user_id]
            );
        }

        if (!result.affectedRows) {
            throw new Error('Error creating time log');
        }
        return {
            message:'Log created successfully'
        };

    } catch(err){
        console.error('Error adding time logs: ', err);
        throw err;
    }
}

export default addTimeLogs;
