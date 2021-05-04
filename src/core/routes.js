const logger = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");

const checkAuth = require("../middlewares/checkAuth");

const {
    UserController,
    MeetingController,
} = require("../controllers");

const createRoutes = (app, io) => {
    const userController = new UserController(io);
    const meetingController = new MeetingController(io);

    app.use(logger("dev"));
    app.use(cors({
        origin: "*",
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "token"],
        preflightContinue: true,
        optionsSuccessStatus: 204
    }));
    app.use(bodyParser.json());
    app.use(checkAuth);

    app.get("/", (_, res) => {
        res.send("Toom server");
    });

    // User routes
    app.get("/user/me", userController.getMe);
    app.post("/user/signup", userController.create);
    app.post("/user/signin", userController.login);
    app.get("/user/verify", userController.verify);
    app.get("/user/:id", userController.getById);

    // Meeting routes
    app.post("/meeting", meetingController.create);
    app.get("/meeting/join/:id", meetingController.join)
};

module.exports = createRoutes;
