const UserModel = require("../models/User");
const MeetingModel = require("../models/Meeting");
const bcrypt = require("bcrypt");
const {createJWTToken} = require("../utils");
const {validationResult} = require("express-validator");
const mailer = require("../core/mailer");

class UserController {
    io;

    constructor(io) {
        this.io = io;
    }

    getById(req, res) {
        const id = req.params.id;
        UserModel.findById(id, (err, user) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }
            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }
            res.json(user);
        });
    }

    getMe(req, res) {
        const id = req.user && req.user._id;
        UserModel.findById(id, (err, user) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }
            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            MeetingModel.find({owner: id}, (err, meetings) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json(err);
                }
                res.json({user, meetings});
            });
        });
    }

    create(req, res) {
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;

        const postData = {
            email: req.body.email,
            fullname: req.body.fullname,
            password: req.body.password,
        };

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({errors: errors.array()});
        } else if (!passwordRegex.test(postData.password)) {
            res.status(422).json({errors: ["Пароль должен сожержать как минимум одну цифру и букву в верхнем и нижнем регистре и быть не меньше 8 символов."]});
        } else {
            UserModel.findOne({email: postData.email}, (err, user) => {
                if (user) {
                    res.status(422).json({errors: ["Пользователь уже зарегестирован."]});
                    return;
                }
                new UserModel(postData)
                    .save()
                    .then((user) => {
                        res.json(user);
                        const production  = 'https://my-toom-server.herokuapp.com/';
                        const development = 'http://localhost:3001/';
                        const url = (process.env.NODE_ENV ? production : development);
                        mailer.sendMail(
                            {
                                from: process.env.ADMIN_EMAIL,
                                to: postData.email,
                                subject: "Подтверждение регистрации в TOOM",
                                html: `Для того, чтобы подтвердить свою почту, <a href="${url}user/verify?hash=${encodeURIComponent(user.confirmHash)}">перейдите по этой ссылке</a>`
                            },
                            function (err, info) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(info);
                                }
                            }
                        );
                    }).catch((reason => {
                        console.error(reason);
                        res.status(500).json({
                            message: reason
                        });
                    }));
            });
        }
    }

    verify(req, res) {
        const hash = req.query.hash;

        if (!hash) {
            res.status(422).json({errors: "Invalid hash"});
        } else {
            UserModel.findOne({confirmHash: hash}, (err, user) => {
                if (err) {
                    return res.status(500).json(err);
                }
                if (!user) {
                    return res.status(404).json({
                        message: err
                    });
                }

                user.confirmed = true;
                user.save((err) => {
                    if (err) {
                        return res.status(500).json(err);
                    }

                    res.json({
                        message: "Аккаунт успешно подтверждён!"
                    });
                });
            });
        }
    }

    login(req, res) {
        const postData = {
            email: req.body.email,
            password: req.body.password,
        }

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.status(422).json({errors: errors.array()});
        } else {
            UserModel.findOne({email: postData.email}, (err, user) => {
                if (err) {
                    return res.status(500).json(err);
                }
                if (!user) {
                    return res.status(404).json({
                        message: "User not found",
                    })
                }

                if (user.confirmed && bcrypt.compareSync(postData.password, user.password)) {
                    const token = createJWTToken(user);
                    res.json({
                        token,
                    });
                } else {
                    res.status(403).json({
                        message: "Incorrect password or email"
                    })
                }
            });
        }
    }
}

module.exports = UserController;
