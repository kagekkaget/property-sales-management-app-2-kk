const { Pool } = require('pg');
const bcryptjs = require('bcryptjs');

const pool = new Pool({ 
  connectionString: "postgresql://neondb_owner:npg_cD6ZWX5Tiunw@ep-cool-mountain-b4qfbcu2-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require" 
});

pool.query("SELECT * FROM users WHERE email = 'owner@kavlingo.com'").then(r => {
  if (r.rows.length === 0) {
    console.log('User not found');
  } else {
    const user = r.rows[0];
    console.log('User found:', { id: user.id, email: user.email, role: user.role, isActive: user.is_active });
    return bcryptjs.compare('owner123', user.password);
  }
}).then(valid => {
  if (valid !== undefined) console.log('Password valid:', valid);
  pool.end();
}).catch(e => {
  console.error('Error:', e.message);
  pool.end();
});