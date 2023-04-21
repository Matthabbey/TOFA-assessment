import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
dotenv.config()

export const db = new Sequelize('app', '', '', {
    storage: './user.sqlite',
    dialect:'sqlite',
    logging: false
})

export const APP_SECRET = process.env.APP_SECRET as string
export const AccountSID = process.env.AccountSID
export const authToken = process.env.authToken
export const fromAdminPhone = process.env.fromAdminPhone
export const GMAIL_USER = process.env.GMAIL_USER
export const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD
export const FromAdminMail = process.env.FromAdminMail as string
export const userSubject = process.env.userSubject as string