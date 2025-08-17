const db=require('../db')
module.exports={
findByToken:token=>db.prepare('select * from users where token=?').get(token),
create:token=>{
const now=Date.now()
const info=db.prepare('insert into users(token,created_at) values(?,?)').run(token,now)
return {id:info.lastInsertRowid,token,created_at:now}
}
}
