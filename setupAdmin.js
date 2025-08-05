const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "mydb05"
});

con.connect(function (err) {
    if (err) {
        console.error("Failed to connect to MySQL:", err.message);
        process.exit(1);
    }
    console.log("Connected to MySQL Database for admin setup");
});

bcrypt.hash('admin123', 10, (err, hash) => {
    if (err) {
        console.error(err);
        process.exit(1);
    } else {
        con.query("INSERT INTO user1 (uname, email, pwd, is_admin, last_login) VALUES (?, ?, ?, 1, NULL)", 
            ['Admin', 'admin@example.com', hash], 
            (err) => {
                if (err) {
                    console.error("Error adding admin:", err);
                    process.exit(1);
                } else {
                    console.log("Admin added successfully");
                }
                con.end();
            }
        );
    }
});