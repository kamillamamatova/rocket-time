import db from './db.js'; // import database

//get one user' log
export async function addTimeLogs(logbody){
    try{
        const date=new Date(logbody.date);
        const mysqldate=date.toISOString().slice(0,19).reaplce("T", " ");
        const result = await db.query(
            ` INSERT INTO timelogs(user_id, goal_id, date, duration_hr, category, title)
      VALUES (?, ?, ?, ?, ?, ?)`,
            [logbody.user_id, logbody.goal_id, mysqldate, 
                logbody.duration_hr, logbody.category, 
                logbody.title]
        );

        let message = 'Error in creating time log';

        if (result.affectedRows) {
            message = 'Log created successfully';
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