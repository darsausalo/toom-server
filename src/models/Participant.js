const mongoose = require("mongoose");
const {Schema} = mongoose;

const ParticipantSchema = new Schema({
    meeting: {
        type: Schema.Types.ObjectId,
        ref: "Meeting",
        require: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
    socketId: {
        type: String,
        require: true,
    }
}, {
    timestamps: true
});

const ParticipantModel = mongoose.model("Participant", ParticipantSchema, "participant");

module.exports = ParticipantModel;
