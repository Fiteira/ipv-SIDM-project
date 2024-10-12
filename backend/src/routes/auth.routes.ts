import { Application, Request, Response } from "express";


module.exports = (app: Application) => {
    const router = require("express").Router();

    const authController = require('../controllers/auth.controller');
    const passport = require("passport");

    const middleware = require("../config/middleware.ts")

    router.route("/login").post(middleware.limitAccess, authController.login);


    router.get('/checktoken', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {

        //console.log(req.user.dataValues);

        //const { userId, userName, roleId, companyId, email, status } = req.user.dataValues;
        res.status(200).json({
            success: true,
            //message: { userId, userName, roleId, companyId, email, status }
        });
    });


    app.use("/api", router);
};