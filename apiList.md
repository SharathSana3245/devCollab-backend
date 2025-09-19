#devcollab list of API

authRouter
POST/signup
POST/login
POST/logout

profileRouter
GET/profile/view
PATCH/profile/edit
PATCH/profile/password

connectionRequestRouter
POST/ request/send/interested/:requestId
POST/request/send/ignored/:requestId
POST/request/review/accepted/:requestId
POST/request/review/rejected/:requestId

userRouter 
GET/user/connections
GET/user/requests/recieved
GET/user/feed --Gets all users of the application to you

status:ignore,interested,accepted,rejected