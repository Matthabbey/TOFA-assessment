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
import { GenerateOTP } from "../utility/notification";

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
        verified: false,
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
        verified: User.verified,
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

export const verifyUser = async (req: Request, res: Response) => {
  try {
    const token = req.params.signature;
    const decode = await verifySignature(token);
    console.log(decode);

    //check if the user is a registered user
    const User = (await UserInstance.findOne({
      where: { email: decode.email },
    })) as unknown as UserAttributes; //we are getting email from the awaiting of verifySignature

    //Getting the otp sent to the user by email or sms by requesting the validaty of the token
    if (User) {
      const { otp } = req.body;
      console.log(typeof User.otp);
      if (User.otp === parseInt(otp) && User.otp_expiry >= new Date()) {
        // User.verified == true
        // const updatedUser = await User.update()
        const updatedUser = (await UserInstance.update(
          { verified: true },
          { where: { email: decode.email } }
        )) as unknown as UserAttributes;

        //Generate another signature for the validated or {updatedUser} verified account
        const signature = await GenerateSignature({
          id: updatedUser.id,
          email: updatedUser.email,
          verified: updatedUser.verified,
        });

        if (updatedUser) {
          const User = (await UserInstance.findOne({
            where: { email: decode.email },
          })) as unknown as UserAttributes;

          return res.status(200).json({
            message: "Your account has been succesfully verified",
            signature,
            verified: User.verified,
          });
        }
      }
    }
    return res.status(400).json({
      Error: "Invalid crediential or OTP is invalid",
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "users/verify",
    });
  }
};

export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    //Check if the user exist
    const User = (await UserInstance.findOne({
      where: { email: email },
    })) as unknown as UserAttributes;

    if (User.verified === false) {
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
          verified: User.verified,
        });
        return res.status(200).json({
          message: "You have successfully logged in",
          verified: User.verified,
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
          verified: false,
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
