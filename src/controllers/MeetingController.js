const MeetingModel = require("../models/Meeting");
const ParticipantModel = require("../models/Participant");
const {validationResult} = require("express-validator");

class MeetingController {
    io;

    constructor(io) {
        this.io = io;
    }

    create(req, res) {
        const userId = req.user && req.user._id;

        const postData = {
            subject: req.body.subject,
            useVideo: req.body.useVideo,
        };
        console.log("postData:", postData);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({errors: errors.array()});
        } else {
            MeetingModel.findOne(postData, (err, meeting) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json(err);
                }
                if (meeting) {
                    return res.status(422).json({message: "Встреча с такой темой уже существует"});
                }
                new MeetingModel({...postData, owner: userId})
                    .save()
                    .then((meeting) => {
                        res.json(meeting);
                    }).catch(err => {
                        console.error(err);
                        res.status(500).json({
                            message: err
                        });
                    });
            });
        }
    }

    join(req, res) {
        const id = req.params.id;

        MeetingModel.findById(id, (err, meeting) => {
            if (err) {
                console.error(err);
                return res.send(500).json(err);
            }
            ParticipantModel.find({meeting: id})
                .populate(["user"])
                .exec((err, participants) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json(err);
                    }

                    res.json({meeting, participants});
                });
        });
    }
}

module.exports = MeetingController;
