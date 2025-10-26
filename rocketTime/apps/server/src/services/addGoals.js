import db from './db.js';

export async function addGoals(logbody){
    try{
        const result = await db.query(
            ` INSERT INTO goals(user_id, title, target_hours, category, deadline)
      VALUES (?, ?, ?, ?, ?)`,
            [logbody.user_id, logbody.title, logbody.target_hours, 
                logbody.category, logbody.deadline]
        );

        let message = 'Error in creating time log';

        if (result.affectedRows) {
            message = 'Goal created successfully';
        }

        return {
            message:'Goal created successfully'
        };

    } catch(err){
        console.error('Error adding goals: ', err);
        throw err;
    }
}

export default addGoals;