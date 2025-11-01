import jwt, { JwtPayload } from "jsonwebtoken";

export const genereateJWT = (payload: JwtPayload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token valid for 30 days
  });
  return token;
};

// Function to verify JWT and return the decoded payload
export const verifyJWT = (token: string): JwtPayload | string => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};
