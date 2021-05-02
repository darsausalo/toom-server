const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");

const {
    UserController,
} = require("../controllers");

const createRoutes = (app, io) => {
    const userController = new UserController(io);

    app.use(logger("dev"));
    app.use(cors());
    app.use(bodyParser.json());

    app.get("/", (_, res) =>{
        res.send("Toom server");
    });

    app.get("/user/me", userController.getMe);
    app.post("/user/signup", userController.create);
    app.post("/user/signin", userController.login);
    app.get("/user/verify", userController.verify);
    app.get("/user/:id", userController.getById);
};

module.exports = createRoutes;
