const Database=require('better-sqlite3')
const fs=require('fs')
const path=require('path')
const dotenv=require('dotenv')
dotenv.config()
const dbPath=process.env.DB_PATH||'server/db.sqlite'
const db=new Database(dbPath)
const schema=fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8')
db.exec(schema)
module.exports=db
