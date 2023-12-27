import multer from 'multer'
import storage from './cloudinary-config.js'

export default multer({ storage })
