const db=require('../db')
module.exports={
findByUserId:id=>db.prepare('select * from profiles where user_id=?').get(id),
create:id=>db.prepare('insert into profiles(user_id) values(?)').run(id)
}
