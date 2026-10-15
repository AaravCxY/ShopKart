import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";

// This middleware checks if the user is logged in
export const protect = async (req, res, next) => {
    try {
        let token = req.cookies?.token;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        // Check if the token is valid
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the customer and do not send the password
        const customer = await Customer.findById(decoded.id).select("-password");

        if (!customer) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        // Save customer in request so other functions can use it
        req.user = customer;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
};
