const sql = require('mssql');
require('dotenv').config();
const { hashPin, verifyPin } = require('../utils/helper');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: { encrypt: false, trustServerCertificate: true }
};

// Register user
exports.registerUser = async (fullName, accountNo, pin) => {
    try {
        let pool = await sql.connect(config);
        const pinHash = await hashPin(pin);

        await pool.request()
            .input('full_name', sql.NVarChar, fullName)
            .input('account_no', sql.NVarChar, accountNo)
            .input('pin_hash', sql.NVarChar, pinHash)
            .query(`INSERT INTO users (full_name, account_no, pin_hash) VALUES (@full_name, @account_no, @pin_hash)`);

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

// Login user
exports.loginUser = async (accountNo, pin) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('account_no', sql.NVarChar, accountNo)
            .query(`SELECT * FROM users WHERE account_no = @account_no`);

        if (result.recordset.length === 0) return false;

        const user = result.recordset[0];
        const isValid = await verifyPin(pin, user.pin_hash);
        return isValid ? user : false;
    } catch (err) {
        console.error(err);
        return false;
    }
};
