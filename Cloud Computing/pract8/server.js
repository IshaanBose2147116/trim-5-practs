require("dotenv").config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require("mysql2");
const multer = require("multer");
const fs = require("fs");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
    accessKeyId: process.env.aws_access_key_id,
    secretAccessKey: process.env.aws_secret_access_key,
    sessionToken: process.env.aws_session_token,
    region: 'us-east-1'
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./.temp");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + ".png");
    }
});
const upload = multer({ storage: storage });
const app = express();
const PORT = process.env.PORT || 3000;
const dbDetails = {
    host: "lms-db.cvajxk38j7jy.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "password123",
    database: "lms"
};
let conn = null;

app.use("/scripts", express.static(path.join(__dirname, './scripts')));
app.use("/styles", express.static(path.join(__dirname, './styles')));
app.use("/images", express.static(path.join(__dirname, './assets/images')));
app.use("/icon", express.static(path.join(__dirname, './assets/icon')));

app.use(cors({
    origin: (origin, callback) => {
        console.log('Origin:', origin);
        callback(null, true);
    },
    methods: [ 'GET', 'POST', 'DELETE', 'UPDATE', 'PUT' ]
}));
app.use(bodyParser.json());

// frontend requests
app.get("/", (req, res) => {
    if (req.headers.referer) {
        const referrerArray = req.headers.referer.split("/");
        
        if (referrerArray[referrerArray.length - 1] === "login") {
            if (req.query.user === "admin") {
                res.sendFile(path.join(__dirname, "./admin_dashboard.html"));
            } else {
                res.sendFile(path.join(__dirname, './index.html'));
            }
        } else {
            res.redirect("/login");
        }
    } else {
        res.redirect("/login");
    }
})
.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, './register.html'));
}).get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, './login.html'));
});

// backend requests
app.post("/login", (req, res) => {
    conn.connect(err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            conn.query("select id from users where email=? and password=?", 
            [ req.body.email, req.body.password ], (err, result) => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else {
                    if (result.length === 1) {
                        res.send({ id: result[0].id }).status(200);
                    } else {
                        res.sendStatus(404);
                    }
                }
            });
        }
    });
})
.post("/register", (req, res) => {
    conn.connect(err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            conn.query("select count(*) as user_exists from users where email=?", [ req.body.email ], (err, result) => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else {
                    if (err) {
                        console.error(err);
                        res.sendStatus(500);
                    } else if (result[0].user_exists > 0) {
                        res.sendStatus(400);
                    } else {
                        conn.query("insert into users values (default, ?, ?)", [ req.body.email, req.body.password ], (err, result) => {
                            if (err) {
                                console.error(err);
                                res.sendStatus(500);
                            } else {
                                res.sendStatus(200);
                            }
                        });
                    }
                }
            });
        }
    });
})
.post("/checkout/:id", (req, res) => {
    conn.connect(err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            conn.query("select count(*) as checked_out from checkouts where checked_out=? and checked_by=?",
            [ req.params.id, req.body.user_id ], (err, result) => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else if (result[0].checked_out == 0) {
                    conn.query("insert into checkouts values (?, ?, ?)", 
                    [ req.body.timestamp, req.params.id, req.body.user_id ], (err, result) => {
                        if (err) {
                            console.error(err);
                            res.sendStatus(500);
                        } else {
                            conn.query("update books set stock = stock - 1 where book_id=?", [ req.params.id ], (err, result) => {
                                if (err) {
                                    console.error(err);
                                    res.sendStatus(500);
                                } else {
                                    res.sendStatus(200);
                                }
                            });
                        }
                    });
                } else {
                    res.sendStatus(400);
                }
            });
        }
    });
})
.post("/return/:id", (req, res) => {
    conn.connect(err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            conn.query("delete from checkouts where checkout_time=?", [ req.params.id ], (err, result) => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else {
                    conn.query("update books set stock = stock + 1 where book_id=?", [ req.body.book_id ], (err, result) => {
                        if (err) {
                            console.error(err);
                            res.sendStatus(500);
                        } else {
                            res.sendStatus(200);
                        }
                    });
                }
            });
        }
    });
})
.post("/upload-image/:id", upload.single("image"), (req, res) => {
    const fileContent = fs.readFileSync(req.file.path);
    console.log(fileContent);
    const params = {
        Bucket: "lms-s3-cac2",
        Key: `book-covers/${ req.params.id }.png`,
        Body: fileContent
    }

    s3.upload(params, (err, data) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            console.log(data.Location);
            fs.unlinkSync(req.file.path);
            res.send({ link: data.Location }).status(200);
        }
    })
})
.post("/upload-book", (req, res) => {
    conn.connect(err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            conn.query("insert into books values (?, ?, ?, ?, ?)", 
            [ req.body.book_id, req.body.title, req.body.author, req.body.available, req.body.cover_link], (err, result) => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
})
.put("/update-book/:id", (req, res) => {
    conn.connect(err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            let query = undefined;
            let params = undefined;

            if (req.body.cover_link) {
                query = "update books set book_id=?, title=?, author=?, stock=?, cover_link=? where book_id=?";
                params = [ req.body.id, req.body.title, req.body.author, req.body.available, req.body.cover_link, req.params.id ];
            } else {
                query = "update books set book_id=?, title=?, author=?, stock=? where book_id=?";
                params = [ req.body.id, req.body.title, req.body.author, req.body.available, req.params.id ];
            }

            conn.query(query, params, (err, result) => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
})
.get("/get-books", (req, res) => {
    conn.connect(err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            conn.query("select * from books", (err, result) => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else {
                    res.send(result).status(200);
                }
            });
        }
    });
})
.get("/get-checkouts/:id", (req, res) => {
    conn.connect(err => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            conn.query("select c.checkout_time, b.* from checkouts c join books b on c.checked_out = b.book_id where c.checked_by = ?",
            [ req.params.id ], (err, result) => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else {
                    const data = [];
                    
                    for (let i = 0; i < result.length; i++) {
                        data.push({
                            timestamp: result[i].checkout_time,
                            book_id: result[i].book_id,
                            title: result[i].title,
                            author: result[i].author,
                            cover_link: result[i].cover_link
                        });
                    }
    
                    res.send(data).status(200);
                }
            });
        }
    });
})
.delete("/delete/:id", (req, res) => {
    const params = {
        Bucket: "lms-s3-cac2",
        Key: `book-covers/${ req.params.id }.png`
    }

    s3.deleteObject(params, (err, data) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            conn.connect(err => {
                if (err) {
                    console.error(err);
                    res.sendStatus(500);
                } else {
                    conn.query("delete from checkouts where checked_out=?", [ req.params.id ], (err, result) => {
                        if (err) {
                            console.error(err);
                            res.sendStatus(500);
                        } else {
                            conn.query("delete from books where book_id=?", [ req.params.id ], (err, result) => {
                                if (err) {
                                    console.error(err);
                                    res.sendStatus(500);
                                } else {
                                    res.sendStatus(200);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

app.listen(PORT, () => {
    console.log("Listening on port: " + PORT);
    conn = mysql.createConnection(dbDetails);
    conn.connect(err => {
        if (err)
            console.error(err);
        else
            console.log('Connection established!');
    });
});