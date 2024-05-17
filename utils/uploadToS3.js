import { s3 } from "./configAWS.js";

/* Function upload ảnh lên s3 */
export const uploadImageToS3 = (file, userId) => {
    const image = file.originalname.split(".");
    const fileType = image[image.length - 1];
    const fileName = `${userId}_${Date.now().toString()}.${fileType}`;
    const s3_params = {
        Bucket: process.env.S3_IMAGE_MESSAGE_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    return s3.upload(s3_params).promise();
};

/* Function upload file lên s3 */
export const uploadFileToS3 = (file, userId) => {
    const fileSend = file.originalname.split(".");
    const fileType = fileSend[fileSend.length - 1];
    const fileName = `${userId}_${
        file.originalname
    }_${Date.now().toString()}.${fileType}`;
    const s3_params = {
        Bucket: process.env.S3_FILE_MESSAGE_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    return s3.upload(s3_params).promise();
};

/* Function upload file lên s3 */
export const uploadVideoToS3 = (file, userId) => {
    const video = file.originalname.split(".");
    const fileType = video[video.length - 1];
    const fileName = `${userId}_${Date.now().toString()}.${fileType}`;
    const s3_params = {
        Bucket: process.env.S3_VIDEO_MESSAGE_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    return s3.upload(s3_params).promise();
};
