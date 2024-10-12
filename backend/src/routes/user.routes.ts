import { Application } from "express";

module.exports = (app: Application) => {
    const user = require("../controllers/user.controller.ts");
    const router = require("express").Router();
    const middleware = require("../config/middleware.ts")


    // get all users
    router.route("/").get(user.getAll);

    // get the user by id
    router.route("/:nUser").get(user.getById);

    // Update the user by id
    router.route("/:nUser").put(user.updateById);

    // Update password the user by token jwt that have the userId
    router.route("/password").put(user.updatePassword);

    // Update password the user by admin
    router.route("/userpassword/:nUser").put(user.updateUserPassword);

    // Create a new user
    router.route("/").post(user.create);

    // delete the user by id
    router.route("/:nUser").delete(user.delete);

    app.use("/api/user", middleware.jwtAuthMiddleware, router);
};