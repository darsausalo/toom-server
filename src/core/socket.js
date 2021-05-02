const {Server} = require("socket.io");

module.exports = (server) => {
    const io = new Server(server);

    io.on("connection", function (socket) {
        socket.on("ROOM:JOIN", ({roomId, userId}) => {
            socket.join(roomId);
            // socket.to(roomId).broadcast.emit("ROOM:")
        });

        socket.on("disconnect", () => {
            // TODO
        });
    });

    return io;
};
