const mongoose = require("mongoose");
const {Schema} = mongoose;

const MessageSchema = new Schema({
    text: {
        type: String,
    },
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
}, {
    timestamps: true,
    usePushEach: true,
});

const MessageModel = mongoose.model("Message", MessageSchema, "message");

module.exports = MessageModel;
