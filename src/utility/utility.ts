
import bcrypt from "bcrypt";
import Joi from "joi";
import { UserPayload } from "../interface";
import Jwt, { JwtPayload } from "jsonwebtoken";
import { APP_SECRET } from "../config";



//To remove the unnecessary character that includes in console.log output of the user error message.
export const option = {
  abortEarly: false,
  errors: {
    wrap: {
      label: "",
    },
  },
};
// Generating of salt code
export const GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

export const GeneratePassword = async (password: string, salt: string) => {
  return await bcrypt.hash(password, salt);
};
//generating token or signature for the user.
export const GenerateSignature = async (payload: UserPayload) => {
  return Jwt.sign(payload, APP_SECRET, { expiresIn: "1d" }); //for week use 'w', for month use 'm', for day use 'd', for minutes use 'min', for hour use 'hour'
};
//Verifying the signature of the user before allowing login
export const verifySignature = async (signature: string) => {
  return Jwt.verify(signature, APP_SECRET) as unknown as JwtPayload;
};

export const validatePassword = async (
  enteredPassword: string,
  savedPassword: string,
  salt: string
) => {
  return (await GeneratePassword(enteredPassword, salt)) === savedPassword;
};


export const adminSchema = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().regex(/[a-z0-9]{3,30}/),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
  });