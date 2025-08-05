const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const _ = require('lodash');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('uploads'));
app.use(express.static(__dirname));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// MySQL connection
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "mydb03"
    
});

con.connect(function (err) {
    if (err) {
        console.error("Failed to connect to MySQL:", err.message);
        process.exit(1);
    }
    console.log("Connected to MySQL Database");

    // One-time admin setup (runs only if admin doesn't exist)
    con.query("SELECT email FROM user1 WHERE email = ?", ['admin@example.com'], (err, results) => {
        if (err) console.error("Check admin error:", err);
        else if (results.length === 0) {
            bcrypt.hash('admin123', 10, (err, hash) => {
                if (err) console.error("Hash error:", err);
                else {
                    con.query("INSERT INTO user1 (uname, email, pwd, is_admin, last_login) VALUES (?, ?, ?, 1, NULL)", 
                        ['Admin', 'admin@example.com', hash], 
                        (err) => {
                            if (err) console.error("Admin insert error:", err);
                            else console.log("Admin added successfully");
                        }
                    );
                }
            });
        }
    });
});

// Ensure uploads directory exists
fs.mkdirSync('uploads', { recursive: true });
fs.mkdirSync(path.join(__dirname, 'public', 'preview'), { recursive: true });

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.session.user?.id || 'guest'}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, videos, and audio are allowed.'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Admin middleware (enforces admin login for admin-only routes)
const isAdmin = (req, res, next) => {
    if (!req.session.user || !req.session.user.is_admin) {
        return res.redirect('/log?message=Admin login required');
    }
    next();
};

// Routes for HTML pages
app.get("/", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "ho1.html"), (err) => {
        if (err) res.status(404).send("Home page not found");
    });
});
app.get("/about1", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "about1.html"));
});
app.get("/portinpt", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "portinpt.html"));
});
app.get("/portfolios", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "portfolios.html"));
});
app.get("/portemplate", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "porttemplate.html"));
});
app.get("/generateport", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "generateport.html"));
});

// Preview pages
app.get("/fash", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "fashpreview.html"));
});
app.get("/soft", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "devpreview.html"));
});
app.get("/photo", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "photopreview.html"));
});
app.get("/sport", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "sportpreview.html"));
});

// Dynamic template routes with bodyContent injection and debugging
const renderTemplate = (templateName) => (req, res) => {
    if (!req.session.user) {
        console.warn("Non-logged-in access attempt, redirecting to /log");
        return res.redirect('/log?message=Please log in');
    }
    con.query('SELECT * FROM portfolios WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', 
        [req.session.user.id], 
        (err, results) => {
            if (err) {
                console.error("MySQL query error:", err);
                return res.status(500).send('Error fetching portfolio data');
            }
            if (results.length === 0) {
                console.warn("No portfolio found for user_id:", req.session.user.id);
                return res.status(404).send('No portfolio data available');
            }
            const portfolio = results[0];
            console.log("Fetched portfolio:", portfolio);
            const normalizedPortfolio = {
                name: portfolio.name || 'Unnamed',
                profession: portfolio.profession || 'Unknown',
                bio: portfolio.bio || 'No bio available',
                profile_picture: portfolio.profile_picture || '/Uploads/placeholder.jpg',
                technical_skills: portfolio.technical_skills || '',
                project_files: portfolio.project_files || '',
                contact_email: portfolio.contact_email || 'N/A',
                phone: portfolio.phone || '',
                linkedin: portfolio.linkedin || '',
                github: portfolio.github || '',
                achievements: portfolio.achievements || '',
                camera_skills: portfolio.camera_skills || '',
                portfolio_link: portfolio.portfolio_link || '',
                design_styles: portfolio.design_styles || '',
                fashion_shows: portfolio.fashion_shows || '',
                sport_type: portfolio.sport_type || ''
            };
            console.log("Normalized project_files:", normalizedPortfolio.project_files); // Debug log
            res.app.render(templateName, { portfolio: normalizedPortfolio, _ }, (err, html) => {
                if (err) {
                    console.error("Rendering error for template", templateName, ":", err.stack);
                    return res.status(500).send('Error rendering template: ' + err.message);
                }
                console.log("Generated bodyContent length:", html.length);
                res.render(templateName, { portfolio: normalizedPortfolio, bodyContent: html, _ });
            });
        }
    );
};

app.get("/fash1", renderTemplate('fash1'));
app.get("/fash2", renderTemplate('fash2'));
app.get("/fash3", renderTemplate('fash3'));
app.get("/fash4", renderTemplate('fash4'));
app.get("/fash5", renderTemplate('fash5'));
app.get("/soft1", renderTemplate('dev1'));
app.get("/soft2", renderTemplate('dev2'));
app.get("/soft3", renderTemplate('dev3'));
app.get("/soft4", renderTemplate('dev4'));
app.get("/soft5", renderTemplate('dev5'));
app.get("/photo1", renderTemplate('photo1'));
app.get("/photo2", renderTemplate('photo2'));
app.get("/photo3", renderTemplate('photo3'));
app.get("/photo4", renderTemplate('photo4'));
app.get("/photo5", renderTemplate('photo5'));
app.get("/sports1", renderTemplate('sport1'));
app.get("/sports2", renderTemplate('sport2'));
app.get("/sports3", renderTemplate('sport3'));
app.get("/sports4", renderTemplate('sport4'));
app.get("/sports5", renderTemplate('sport5'));

app.get("/projects", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "projects.html"));
});
app.get("/contacts", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "contacts.html"));
});
app.get("/log", (req, res) => res.sendFile(path.join(__dirname, "login.html")));
app.get("/reg", (req, res) => res.sendFile(path.join(__dirname, "register.html")));
app.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Check login status
app.get('/check-login', (req, res) => {
    res.json({ 
        isLoggedIn: !!req.session.user,
        user: req.session.user ? { uname: req.session.user.uname } : null 
    });
});

// Handle registration
app.post("/reg", async (req, res) => {
    const { uname, email, pwd, pwd1 } = req.body;
    console.log("Registration data:", { uname, email, pwd, pwd1 });
    if (!uname || !email || !pwd || !pwd1) {
        return res.status(400).send("All fields are required");
    }
    if (pwd !== pwd1) {
        return res.status(400).send("Passwords do not match");
    }
    try {
        con.query("SELECT email FROM user1 WHERE email = ?", [email], (err, results) => {
            if (err) {
                console.error("MySQL error:", err);
                return res.status(500).send("Server error checking email");
            }
            if (results.length > 0) {
                return res.status(400).send("Email already registered");
            }
            bcrypt.hash(pwd, 10, (err, hashedPwd) => {
                if (err) {
                    console.error("Bcrypt error:", err);
                    return res.status(500).send("Error hashing password");
                }
                con.query("INSERT INTO user1 (uname, email, pwd, is_admin, last_login) VALUES (?, ?, ?, 0, NULL)", 
                    [uname, email, hashedPwd], 
                    (err, result) => {
                        if (err) {
                            console.error("MySQL error:", err);
                            return res.status(500).send(`Server error during registration: ${err.message}`);
                        }
                        console.log("User registered:", email);
                        res.redirect("/log");
                    }
                );
            });
        });
    } catch (err) {
        console.error("Unexpected error:", err);
        res.status(500).send("Unexpected server error");
    }
});

// Handle login with proper redirection
app.post("/log", (req, res) => {
    const { email, pwd } = req.body;
    console.log("Login attempt:", { email, pwd });
    con.query("SELECT * FROM user1 WHERE email = ?", [email], async function (err, result) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Server error during login");
        }
        console.log("Query result:", result);
        if (result.length > 0) {
            const user = result[0];
            const match = await bcrypt.compare(pwd, user.pwd);
            console.log("Password match:", match);
            if (match) {
                req.session.user = { id: user.id, uname: user.uname, email: user.email, is_admin: user.is_admin || 0 };
                con.query("UPDATE user1 SET last_login = NOW() WHERE id = ?", [user.id], (err) => {
                    if (err) console.error("Failed to update last_login:", err);
                });
                if (user.is_admin) {
                    res.redirect('/admin');
                } else {
                    res.redirect('/'); // Redirect regular users to home page
                }
            } else {
                res.status(401).send("Invalid email or password");
            }
        } else {
            res.status(401).send("Invalid email or password");
        }
    });
});

// Handle logout
app.get('/logout', (req, res) => {
    if (req.session.user) {
        con.query("UPDATE user1 SET last_login = NULL WHERE id = ?", [req.session.user.id], (err) => {
            if (err) console.error("Failed to clear last_login:", err);
        });
    }
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error logging out");
        }
        res.redirect('/log');
    });
});

// Portfolio submission
app.post('/submit-portfolio', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'projectFiles', maxCount: 5 }
]), (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    const portfolioData = {
        user_id: req.session.user.id,
        name: req.body.name || 'Unnamed',
        bio: req.body.bio || 'No bio available',
        profession: req.body.profession || 'Unknown',
        profile_picture: req.files['profilePicture'] ? req.files['profilePicture'][0].path : '',
        technical_skills: req.body.technicalSkills || '',
        projects: req.body.projects || '',
        contact_email: req.body.contact || 'N/A',
        phone: req.body.phone || '',
        linkedin: req.body.linkedin || '',
        github: req.body.github || '',
        project_files: req.files['projectFiles'] ? req.files['projectFiles'].map(file => file.path).join(',') : '',
        achievements: req.body.achievements || '',
        camera_skills: req.body.cameraSkills || '',
        portfolio_link: req.body.portfolioLink || '',
        design_styles: req.body.designStyles || '',
        fashion_shows: req.body.fashionShows || '',
        sport_type: req.body.sportType || ''
    };
    console.log("Portfolio data:", portfolioData);
    const query = 'INSERT INTO portfolios SET ?';
    con.query(query, portfolioData, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving portfolio!');
        }
        const professionMap = {
            developer: 'soft',
            photographer: 'photo',
            fashion: 'fash',
            sports: 'sport'
        };
        const profession = (req.body.profession || '').toLowerCase();
        if (!professionMap[profession]) {
            return res.status(400).send('Invalid profession');
        }
        res.redirect(`/${professionMap[profession]}`);
    });
});

// Fetch latest portfolios
app.get('/get-latest-portfolios', (req, res) => {
    if (!req.session.user) return res.redirect('/log?message=Please log in');
    const query = 'SELECT * FROM portfolios WHERE user_id = ? ORDER BY created_at DESC LIMIT 5';
    con.query(query, [req.session.user.id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching portfolios');
        }
        res.json(results);
    });
});

// Admin dashboard route
app.get('/admin', isAdmin, (req, res) => {
    con.query('SELECT id, uname, email, is_admin, last_login FROM user1', (err, users) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error loading admin page');
        }
        const threshold = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes threshold
        const activeUsers = users.map(user => ({
            ...user,
            isLoggedIn: user.last_login && new Date(user.last_login) > threshold
        }));
        res.render('admin', { users: activeUsers });
    });
});

// Add user route (admin action)
app.post('/admin/add-user', isAdmin, async (req, res) => {
    const { uname, email, pwd, is_admin } = req.body;
    console.log("Add user attempt:", { uname, email, pwd, is_admin }); // Debug log
    if (!uname || !email || !pwd) {
        return res.status(400).send("All fields (username, email, password) are required");
    }
    try {
        con.query("SELECT email FROM user1 WHERE email = ?", [email], (err, results) => {
            if (err) {
                console.error("MySQL error checking email:", err);
                return res.status(500).send("Server error checking email");
            }
            if (results.length > 0) {
                return res.status(400).send("Email already registered");
            }
            // Ensure is_admin is a boolean or number (0 or 1)
            const adminStatus = is_admin === '1' ? 1 : 0; // Explicitly convert string '1' to 1
            console.log("Processed admin status:", adminStatus); // Debug processed value
            bcrypt.hash(pwd, 10, (err, hashedPwd) => {
                if (err) {
                    console.error("Bcrypt error:", err);
                    return res.status(500).send("Error hashing password");
                }
                con.query("INSERT INTO user1 (uname, email, pwd, is_admin, last_login) VALUES (?, ?, ?, ?, NULL)", 
                    [uname, email, hashedPwd, adminStatus], 
                    (err, result) => {
                        if (err) {
                            console.error("MySQL error inserting user:", err);
                            return res.status(500).send(`Server error during user addition: ${err.message}`);
                        }
                        console.log("User added:", email, "as admin:", adminStatus);
                        res.redirect('/admin');
                    }
                );
            });
        });
    } catch (err) {
        console.error("Unexpected error:", err);
        res.status(500).send("Unexpected server error");
    }
});

// Delete user route (admin action)
app.get('/admin/delete-user/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    con.query('DELETE FROM user1 WHERE id = ?', [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting user');
        }
        con.query('DELETE FROM portfolios WHERE user_id = ?', [id], (err) => {
            if (err) console.error("Failed to delete associated portfolios:", err);
            res.redirect('/admin');
        });
    });
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});