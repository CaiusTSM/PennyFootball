DROP DATABASE IF EXISTS penny_football;
CREATE DATABASE penny_football;
USE penny_football;

CREATE TABLE users
(
username VARCHAR(150) NOT NULL,
password VARCHAR(150) NOT NULL,
wins INTEGER NOT NULL,
losses INTEGER NOT NULL,
PRIMARY KEY (username)
);

CREATE TABLE ongoing_games
(
uuid VARCHAR(150) NOT NULL,
username1 VARCHAR(150) NOT NULL,
username2 VARCHAR(150) NOT NULL,
PRIMARY KEY (uuid),
FOREIGN KEY (username1) REFERENCES users(username),
FOREIGN KEY (username2) REFERENCES users(username)
);

INSERT INTO users (username, password, wins, losses) VALUES ("testuser", "testpassword", 0, 0);
INSERT INTO users (username, password, wins, losses) VALUES ("testing1", "testing1", 0, 0);
INSERT INTO users (username, password, wins, losses) VALUES ("testing2", "testing2", 0, 0);
INSERT INTO users (username, password, wins, losses) VALUES ("testing3", "testing3", 0, 0);