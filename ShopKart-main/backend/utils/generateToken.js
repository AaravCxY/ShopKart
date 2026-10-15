import jwt from "jsonwebtoken";

// This function creates a JWT for the logged in customer
export const generateToken = (customerId) => {
    const token = jwt.sign(
        { id: customerId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return token;
};
