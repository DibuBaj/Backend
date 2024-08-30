import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({limit: "16kb",extended:true}))
app.use(express.static('public'))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'
import recipeRouter from './routes/recipe.routes.js'
import likeRouter from './routes/like.routes.js'

//router declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/recipes",recipeRouter)
app.use("/api/v1/likes",likeRouter)

export {app}