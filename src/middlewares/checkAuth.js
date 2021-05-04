const {verifyJWTToken} = require("../utils");

module.exports = (req, res, next) => {
    if (
        req.path === "/user/signin" ||
        req.path === "/user/signup" ||
        req.path === "/user/verify" ||
        req.method === "OPTIONS"
    ) {
        return next();
    }

    const token = "token" in req.headers ? req.headers.token : null;
    if (token) {
        verifyJWTToken(token)
            .then((user) => {
                if (user) {
                    req.user = user.data._doc;
                    next();
                } else {
                    console.error("Invalid auth token provided:", token);
                    res.status(403).json({message: "Invalid auth token provided."});
                }
            })
            .catch(() => {
                console.error("Invalid auth token provided:", token);
                res.status(403).json({message: "Invalid auth token provided."});
            });
    } else {
        console.error("JWT token not found");
        res.status(403).json({message: "Not authorized."});
    }
};
