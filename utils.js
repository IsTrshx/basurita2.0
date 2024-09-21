// utils.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('allowedUsers.db');

// Crear la tabla si no existe
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS allowedUsers (
            id INTEGER PRIMARY KEY,
            firstName TEXT,
            lastName TEXT,
            username TEXT
        )
    `);
});

function loadAllowedUsers(callback) {
    if (typeof callback !== 'function') {
        throw new Error('Callback debe ser una función');
    }

    db.all("SELECT id FROM allowedUsers", [], (err, rows) => {
        if (err) {
            console.error('Error al leer la base de datos:', err);
            return callback([]);
        }
        const allowedUsers = rows.map(row => row.id);
        callback(allowedUsers);
    });
}

function saveAllowedUser(user) {
    const { id, first_name, last_name, username } = user;
    db.run(`
        INSERT INTO allowedUsers (id, firstName, lastName, username)
        VALUES (?, ?, ?, ?)
    `, [id, first_name, last_name, username], (err) => {
        if (err) {
            console.error('Error al guardar el usuario en la base de datos:', err);
        }
    });
}

function deleteAllowedUser(userId, callback) {
    if (typeof callback !== 'function') {
        throw new Error('Callback debe ser una función');
    }

    db.run("DELETE FROM allowedUsers WHERE id = ?", [userId], (err) => {
        if (err) {
            console.error('Error al eliminar el usuario de la base de datos:', err);
            return callback(false);
        }
        callback(true);
    });
}

const statistics = {
    photosProcessed: 0,
    videosProcessed: 0,
    gifsProcessed: 0,
    userStats: {} // { userId: { count: number, firstName: string, lastName: string, username: string } }
};

function incrementPhotoCount(userId, userInfo) {
    statistics.photosProcessed++;
    updateUserStats(userId, userInfo);
}

function incrementVideoCount(userId, userInfo) {
    statistics.videosProcessed++;
    updateUserStats(userId, userInfo);
}

function incrementGifCount(userId, userInfo) {
    statistics.gifsProcessed++;
    updateUserStats(userId, userInfo);
}

function updateUserStats(userId, userInfo) {
    if (!statistics.userStats[userId]) {
        statistics.userStats[userId] = { count: 0, ...userInfo };
    }
    statistics.userStats[userId].count++;
}

function getStats() {
    return statistics;
}

module.exports = { loadAllowedUsers, saveAllowedUser, deleteAllowedUser, incrementPhotoCount, incrementVideoCount, incrementGifCount, getStats };
