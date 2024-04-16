import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

// const fileFilter = (file, cb) => {
//   const fileType = /jpeg|jpg|png/;

//   const checkFileType = fileType.test(
//     path.extname(file.originalname).toLowerCase()
//   );
//   const checkMimeType = fileType.test(file.mimetype);

//   if (checkFileType && checkMimeType) {
//     return cb(null, true);
//   } else {
//     return cb("Invalid file type");
//   }
// };

export const upload = multer({
  storage: storage,
  // fileFilter(req, file, cb) {
  //   fileFilter(file, cb);
  // },
});
