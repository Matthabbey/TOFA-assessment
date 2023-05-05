import express, { Request, Response } from "express";
import {
  option,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  verifySignature,
  validatePassword,
} from "../utility/utility";
import { UserAttributes, UserInstance } from "../model/userModels";
import { v4 as uuidv4 } from "uuid";
// import { FromAdminMail, userSubject } from "../config/index";
import { JwtPayload } from "jsonwebtoken";
import { GenerateOTP, createPasswordToken, mailSent } from "../utility/notification";
import { FromAdminMail, userSubject } from "../config";

export const Register = async (req: Request, res: Response) => {
  try {
    const { email, phone, password, address, confirm_password } = req.body;
    const uuiduser = uuidv4();
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);
    const User = await UserInstance.findOne({ where: { email: email } });

    const { otp, expiry } = GenerateOTP();

    if (!User) {
      const user = await UserInstance.create({
        id: uuiduser,
        email,
        password: userPassword,
        firstName: "",
        lastName: "",
        salt,
        companyName: address,
        phone,
        otp,
        otp_expiry: expiry,
        role: "admin",
      });

      //Check if the user exist.
      const User = (await UserInstance.findOne({
        where: { email: email },
      })) as unknown as UserAttributes;

      //Generate a signature
      const signature = await GenerateSignature({
        id: User.id,
        email: User.email,
        verified: true
      });

      return res.status(201).json({
        messsage: "User successfully created",
        User,
        signature,
      });
    }
    return res.status(400).json({
      message: "User already exit",
    });

    //console.log(userPassword)
  } catch (error) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/user/signup",
    });
    console.log(error);
  }
};


export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    //Check if the user exist
    const User = (await UserInstance.findOne({
      where: { email: email },
    })) as unknown as UserAttributes;

    if (User) {
      const validation = await validatePassword(
        password,
        User.password,
        User.salt
      );
      //   const validation = await bcrypt.compare(password, User.password)
      if (validation) {
        const signature = await GenerateSignature({
          id: User.id,
          email: User.email,
          verified: true
        });
        return res.status(200).json({
          message: "You have successfully logged in",
          email: User.email,
          signature,
        });
      }
    }
    return res
      .status(400)
      .json({ message: "Wrong Username or password / not varified user" });
  } catch (error) {
    res.status(500).json({
      Error: `Internal server ${error}`,
      route: "/user/signup",
    });
    console.log(error);
  }
};

export const CreateUser = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.user.id;
    console.log(id);
    const { phone, address, email, password } = req.body;

    // const {email, password, name, ownerName, pincode, address, phone} = req.body
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);
    const uuidUser = uuidv4();

    const { otp, expiry } = GenerateOTP();

    //Check if the user exist.
    const User = (await UserInstance.findOne({
      where: { email: email },
    })) as unknown as UserAttributes;

    // if (User.email === email) {
    //   return res.status(400).json({
    //     message: "Email Already",
    //   });
    // }

    const Admin = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes;

    if (Admin.role === "admin") {
      if (!User) {
        const createUser = await UserInstance.create({
          id: uuidUser,
          email,
          password,
          firstName: "",
          lastName: "",
          salt,
          companyName: address,
          phone,
          role: "user",
          otp,
          otp_expiry: expiry,
        });
        return res.status(201).json({
          message: "user is created successfully",
          createUser,
        });
      }
      return res.status(201).json({
        message: "user already exit",
      });
    }

    return res.status(400).json({
      message: "Unathourized",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      Error: `Internal Error ${error} `,
    });
  }
};

