const jwt = require("jsonwebtoken");

module.exports = (token) => new Promise((resolve, reject) => {
    jwt.verify(
        token,
        process.env.JWT_SECRET || "",
        (err, decodedData) => {
            if (err || !decodedData) {
                console.log("failed to verify JWT:", process.env.JWT_SECRET, ", token:", token)
                return reject(err);
            }

            resolve(decodedData);
        }
    );
});
