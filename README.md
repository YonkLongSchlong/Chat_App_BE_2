## Chạy chương trình

Bạn sẽ cần phải điền vào file .env trong project những thông tin cần thiết sau:

![image](https://github.com/user-attachments/assets/0fcefd23-3237-44bf-a216-4c040f9aba2c)

```bash
PORT                       // port dùng để gọi các api (chỉnh sửa giống với port trong BE project)
MONGO_URI                  // uri kết nối của [MongoDB Cluster](https://account.mongodb.com/account/login)
JWT_SECRET                 // mật mã JWT
ACCRESS_KEY                // access key của AWS IAMUSER (tài khoản cần được cấp quyền sử dụng dịch vụ S3)
SECRET_ACCESS_KEY          // secret access key của AWS IAMUSER
REGION                     // khu vực của Bucket sử dụng (các bucket được tạo sẽ để chung 1 khu vực)
S3_AVATAR_BUCKET           // bucket chứa hình ảnh đại diện người dùng
S3_IMAGE_MESSAGE_BUCKET    // bucket chứa tin nhắn hình ảnh
S3_FILE_MESSAGE_BUCKET     // bucket chứa tin nhắn file
S3_VIDEO_MESSAGE_BUCKET    // bucket chứa tin nhắn video
```

Cài các dependencies:

```bash
npm install
```

Chạy project:

```bash
npm run start
```


## Mô tả

Pandalo là một chat app giúp người dùng có thể dễ dàng liên lạc với nhiều người dùng khác một cách dễ dàng và tiện lợi. Với giao diện thân thiện, người dùng sẽ dễ dàng làm quen một cách nhanh chóng và sử dụng app thuận lợi. 

### App bao gồm các chức năng chính như:

- Đăng ký tạo tài khoản thông qua email và otp
- Đăng nhập
- Chỉnh sửa chi tiết thông tin cá nhân
- Tìm kiếm bạn bè bằng SĐT
- Chat 1v1, chat nhóm
- Gửi tin nhắn văn bản, hình ảnh, video, file
- Kiểm soát thành viên trong nhóm
- Kiểm soát hoạt động của nhóm

### Công nghệ đã sử dụng cho BE
- [NodeJS (ExpressJS)](https://expressjs.com/): Dùng để thiết lập các Api
- [Socket.IO](https://socket.io/):  Thực hiện các chức năng nhắn tin, kết bạn trong thời gian thực - real time
- [JWT](https://jwt.io/): Thiết lập bảo mật cho app
- [Mongoose](https://mongoosejs.com/): Tạo schema cho database và sử dụng các hàm query để tương tác với dữ liệu trong database
- AWS S3: Tạo các Bucket để lưu trữ hình ảnh, tập tin file, video các tin nhắn và avatar người dùng
- MongoDB: database

## Link video demo

https://drive.google.com/file/d/1t9vCuor6AlqJqWyB5PqJx_n6G42PvXSO/view?usp=drive_link

