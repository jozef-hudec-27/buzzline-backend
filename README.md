# BuzzLine

<a href="https://buzzline.live" target="_blank">
    <img class="hero__main-img" src="https://github.com/jozef-hudec-27/buzzline-frontend/blob/main/app/opengraph-image.png?raw=true" alt="BuzzLine" />
</a>

<br>

BuzzLine is a real-time messaging and calling web application. Features include audio/video call, live messages and notifications, voice clip recording and more. Visit at [https://buzzline.live](https://buzzline.live).

<br>
<div>
<img class="hero__app-preview-photo" src="https://res.cloudinary.com/dsbky2fbe/image/upload/v1706466973/buzzline-register_tiicij.png" alt="Buzzline register page" width="500"/>

<img class="hero__app-preview-photo" src="https://res.cloudinary.com/dsbky2fbe/image/upload/v1709373061/buzzline-chat-2_xtw2mh.png" alt="Buzzline dashboard" width="500"/>

<img class="hero__app-preview-photo" src="https://res.cloudinary.com/dsbky2fbe/image/upload/v1709377232/buzzline-current-call_eo6yup.png" alt="Buzzline video call" width="500"/>
</div>
<br/>

## 🔥 BuzzLine Back End

This repo contains code for BuzzLine's back-end (front-end code can be found [here](https://github.com/jozef-hudec-27/buzzline-frontend)) - an Express.js REST API.

### 🦾 Tech Stack

- [Express.js](https://expressjs.com/)
- [Mongoose.js](https://mongoosejs.com/)
- [Passport.js](https://www.passportjs.org/)
- [Socket.IO](https://socket.io/)
- [JWT](https://jwt.io/)
- [Cloudinary API](https://cloudinary.com/documentation)

### 🔋 Features

👉 JWT authentication with Passport.js

👉 WebSocket functionality with Socket.IO - streaming messages, notifications, online status and more!

👉 Processing files with multer and storing them in the cloud

👉 API rate limiting

👉 Resource pagination

### 🚄 Quick Start

In case you want to run the project locally, follow these instructions.

#### Prerequisites

Make sure you have the following installed on your machine:

- Git
- Yarn

#### Clone the repo

```
git clone git@github.com:jozef-hudec-27/buzzline-backend.git
cd buzzline-backend
```

#### Install dependencies

```
yarn install
```

#### Set up environment variables

Create a file called `.env` in the root of the project and add the following:

```
DB_CONNECTION_STRING=<YOUR DB CONNECTION STRING>
JWT_SECRET=<YOUR JWT SECRET>
PORT=4000
CLIENT_URL=<YOUR CLIENT URL (http://localhost:3000)>
CLOUDINARY_CLOUD_NAME=<YOUR CLOUDINARY CLOUD NAME>
CLOUDINARY_API_KEY=<YOUR CLOUDINARY API KEY>
CLOUDINARY_API_SECRET=<YOUR CLOUDINARY API SECRET>
```

#### Run the project

```
yarn dev
```

Open [http://127.0.0.1:4000](http://127.0.0.1:4000) and voila!
