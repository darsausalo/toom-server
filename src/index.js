const express = require("express");
const dotenv = require("dotenv");
const {createServer} = require("http");

dotenv.config();

require("./core/db");
const createRoutes = require("./core/routes");
const createSocket = require("./core/socket");

const app = express();
const server = createServer(app);
const io = createSocket(server);

createRoutes(app, io);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

server.listen(PORT, () => {
    const addr = server.address();
    const bind = typeof addr === "string"
        ? "pipe " + addr
        : "port " + addr.port;

    console.log("Listening on " + bind);
});
