- Trước tiên ta thêm vào trong file .env các value cần thiết để thực hiện chạy chương trình:
- ![image](https://github.com/user-attachments/assets/0fcefd23-3237-44bf-a216-4c040f9aba2c)
  - PORT: port host
  - MongoURI: uri kết nối của mongodb cluster
  - JWT_SECRET: khóa JWT
  - ACCRESS_KEY: access key của AWS IAMUSER (tài khoản cần được cấp quyền sử dụng dịch vụ S3)
  - SECRET_ACCESS_KEY:  secret access key của AWS IAMUSER
  - REGION: khu vực của bucket sử dụng (các bucket để chung 1 khu vực)
  - S3_AVATAR_BUCKET: bucket chứa hình ảnh đại diện người dùng
  - S3_IMAGE_MESSAGE_BUCKET: bucket chứa tin nhắn hình ảnh
  - S3_FILE_MESSAGE_BUCKET: bucket chứa tin nhắn file
  - S3_VIDEO_MESSAGE_BUCKET: bucket chứa tin nhắn video



- Mô tả: Pandalo là một chat app giúp người dùng đăng ký tạo tài khoản và thực hiện liên lạc với các người dùng khác một cách dễ dàng, nhanh chóng.
- Các chức năng bao gồm:
  - Đăng ký tạo tài khoản thông qua email và otp
  - Đăng nhập
  - Chỉnh sửa chi tiết thông tin cá nhân
  - Tìm kiếm bạn bè bằng SĐT
  - Chat 1v1, chat nhóm
  - Gửi tin nhắn văn bản, hình ảnh, video, file
  - Kiểm soát thành viên trong nhóm
  - Kiểm soát hoạt động của nhóm
