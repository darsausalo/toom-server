const {Server} = require("socket.io");
const ParticipantModel = require("../models/Participant");
const MessageModel = require("../models/Message");

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    const populateParticipants = (socket, meetingId, emitMessages = false) => {
        ParticipantModel.find({meeting: meetingId})
            .populate(["user"])
            .exec((err, participants) => {
                if (err) {
                    console.error(err);
                    return;
                }

                socket.to(meetingId).emit("MEETING:SET_PARTICIPANTS", participants);
                socket.emit("MEETING:SET_PARTICIPANTS", participants);
            });

        if (emitMessages) {
            MessageModel.find({meeting: meetingId})
                .populate(["user"])
                .exec((err, messages) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    socket.to(meetingId).emit("MEETING:SET_MESSAGES", messages);
                    socket.emit("MEETING:SET_MESSAGES", messages);
                });
        }
    };

    io.on("connection", function (socket) {
        let currentMeetingId = null;
        let currentUserId = null;

        socket.on("MEETING:JOIN", ({meetingId, userId}) => {
            socket.join(meetingId);
            currentMeetingId = meetingId;
            currentUserId = userId;

            ParticipantModel.findOne({meeting: meetingId, user: userId}, (err, participant) => {
                if (err) {
                    console.error(err);
                    return;
                }
                if (!participant) {
                    new ParticipantModel({meeting: meetingId, user: userId, socketId: socket.id})
                        .save()
                        .then(() => {
                            populateParticipants(socket, meetingId, true);
                        })
                        .catch(err => {
                            console.error(err);
                        });
                } else {
                    populateParticipants(socket, meetingId, true);
                }
            }).catch(err => {
                console.error(err);
            });

            console.log("JOIN TO MEETING: ", meetingId, userId);
        });

        socket.on("MEETING:NEW_MESSAGE", ({meetingId, userId, text}) => {
            new MessageModel({text, meeting: meetingId, user: userId})
                .save()
                .then((message) => {
                    MessageModel.populate(message, {path: "user"}, (err, message) => {
                       if (err) {
                           console.error(err);
                           return;
                       }
                        console.log("NEW_MESSAGE:", message);
                        socket.to(meetingId).emit("MEETING:ADD_MESSAGE", message);
                        socket.emit("MEETING:ADD_MESSAGE", message);
                    });
                })
                .catch(err => {
                    console.error(err);
                });
        });

        socket.on("disconnect", () => {
            if (currentMeetingId && currentUserId) {
                ParticipantModel.deleteMany({socketId: socket.id}, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    populateParticipants(socket, currentMeetingId);
                }).catch(err => {
                    console.error(err);
                });
            }
            console.log("user disconnected", socket.id, currentUserId);
        });

        console.log('user connected', socket.id);
    });

    return io;
};
