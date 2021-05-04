const {Server} = require("socket.io");
const ParticipantModel = require("../models/Participant");
const MessageModel = require("../models/Message");

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET","HEAD","PUT","PATCH","POST","DELETE"],
            credentials: false,
        }
    });

    const populateParticipants = (socket, meetingId, userId, emitMessages = false) => {
        ParticipantModel.find({meeting: meetingId})
            .populate(["user"])
            .exec((err, participants) => {
                if (err) {
                    console.error(err);
                    return;
                }

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

                    socket.emit("MEETING:SET_MESSAGES", messages);
                });
        }
    };

    const exitMeeting = (socket) => {
        ParticipantModel.findOneAndDelete({socketId: socket.id}, (err, participant) => {
            if (err) {
                console.log(err);
                return;
            }
            if (participant) {
                socket.broadcast.emit("MEETING:REMOVE_PARTICIPANT", participant);
            }
        });
    };

    io.on("connection", function (socket) {
        let currentMeetingId = null;
        let currentUserId = null;

        socket.on("MEETING:JOIN", ({meetingId, userId}) => {
            socket.join(meetingId);
            currentMeetingId = meetingId;
            currentUserId = userId;

            const filter = {meeting: meetingId, user: userId};
            const update = {meeting: meetingId, user: userId, socketId: socket.id};
            ParticipantModel.findOneAndUpdate(filter, update, {new: true, upsert: true}, (err, participant) => {
                if (err) {
                    console.error(err);
                    return;
                }
                populateParticipants(socket, meetingId, userId, true);

                ParticipantModel.populate(participant, {path: "user"}, (err, participant) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    socket.to(meetingId).emit("MEETING:ADD_PARTICIPANT", participant);
                })
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
                }).catch(err => {
                console.error(err);
            });
        });

        socket.on("MEETING:EXIT", () => {
            exitMeeting(socket);

            console.log("user exit meeting", socket.id);
        });

        socket.on("disconnect", () => {
            exitMeeting(socket);

            console.log("user disconnected", socket.id);
        });

        socket.on("VIDEO:JOIN", payload => {
            console.log("payload:", payload);
            ParticipantModel.find({meeting: payload.meetingId, user: {"$ne": payload.userId}}, (err, participants) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("VIDEO:SET_PEERS:", participants.length);
                socket.emit("VIDEO:SET_PEERS", participants.filter(p => p.user !== payload.userId));
            });
        });

        socket.on("VIDEO:SENDING_SIGNAL", payload => {
            socket.to(payload.userToSignal).emit("VIDEO:STARTED", {signal: payload.signal, callerID: payload.callerID});
        });

        socket.on("VIDEO:RETURNING_SIGNAL", payload => {
            socket.to(payload.callerID).emit("VIDEO:RECEIVING_RETURNED_SIGNAL", {
                signal: payload.signal,
                id: socket.id
            });
        });

        console.log('user connected', socket.id);
    });

    return io;
};
