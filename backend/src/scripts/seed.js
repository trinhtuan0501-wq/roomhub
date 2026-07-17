const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Amenity = require('../models/Amenity');
const RentalRequest = require('../models/RentalRequest');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roomhub');
    console.log('MongoDB Connected for Seeding...');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Premium Unsplash Room Images
const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80',
];

const AMENITIES_DATA = [
  { name: 'Wi-Fi', icon: 'wifi-outline', category: 'basic' },
  { name: 'Điều hòa', icon: 'snow-outline', category: 'basic' },
  { name: 'Máy giặt', icon: 'sync-outline', category: 'basic' },
  { name: 'Tủ lạnh', icon: 'cube-outline', category: 'basic' },
  { name: 'Nóng lạnh', icon: 'thermometer-outline', category: 'basic' },
  { name: 'Ban công', icon: 'leaf-outline', category: 'facility' },
  { name: 'Chỗ để xe', icon: 'car-outline', category: 'facility' },
  { name: 'Camera an ninh', icon: 'videocam-outline', category: 'safety' },
  { name: 'Bảo vệ 24/7', icon: 'shield-checkmark-outline', category: 'safety' },
  { name: 'Thang máy', icon: 'arrow-up-outline', category: 'facility' },
];

const ROOM_TYPES_DATA = [
  { name: 'Phòng trọ', description: 'Phòng trọ bình dân có gác lửng' },
  { name: 'Căn hộ mini', description: 'Căn hộ Studio khép kín đầy đủ tiện nghi' },
  { name: 'Chung cư', description: 'Chung cư cao cấp nhiều phòng ngủ' },
  { name: 'Nhà nguyên căn', description: 'Nhà riêng tư nguyên căn thích hợp cho gia đình' },
  { name: 'Phòng ở ghép', description: 'Ở chung ghép share phòng tiết kiệm chi phí' },
  { name: 'Ký túc xá', description: 'Ký túc xá giường tầng máy lạnh' },
];

// District and wards in TP.HCM & Dĩ An Bình Dương
const LOCATIONS = [
  {
    province: 'Bình Dương',
    district: 'Dĩ An',
    ward: 'Đông Hòa',
    details: ['Khu phố Tân Lập, gần hồ đá', 'Đường vành đai Đại học Quốc gia', 'Số 12 Đường số 5, Kp Tân Hòa', 'Đường trục chính KĐT Đại Học Quốc Gia'],
  },
  {
    province: 'Hồ Chí Minh',
    district: 'Thủ Đức',
    ward: 'Linh Trung',
    details: ['Đường Kha Vạn Cân, gần chợ Thủ Đức', 'Số 45 Đường số 8, gần ĐH Nông Lâm', 'Đường Võ Văn Ngân, gần ngã tư Thủ Đức'],
  },
  {
    province: 'Hồ Chí Minh',
    district: 'Thủ Đức',
    ward: 'Tăng Nhơn Phú A',
    details: ['Đường Lê Văn Việt, gần ĐH Giao Thông Vận Tải', 'Đường Đình Phong Phú'],
  },
  {
    province: 'Hồ Chí Minh',
    district: 'Quận 10',
    ward: 'Phường 14',
    details: ['Đường Thành Thái, gần ĐH Bách Khoa', 'Đường Lý Thường Kiệt'],
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // 1. Clear existing collections
    console.log('Clearing old database records...');
    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      RoomType.deleteMany({}),
      Amenity.deleteMany({}),
      RentalRequest.deleteMany({}),
      Favorite.deleteMany({}),
      Review.deleteMany({}),
      Report.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    // 2. Hash default passwords
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    const landlordPassword = await bcrypt.hash('Landlord@123456', 10);
    const tenantPassword = await bcrypt.hash('Tenant@123456', 10);

    // 3. Create Admin user
    console.log('Seeding admin...');
    const admin = await User.create({
      fullName: 'RoomHub Administrator',
      email: 'admin@roomhub.vn',
      phone: '0901234567',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
    });

    // 4. Create Landlords (10 accounts)
    console.log('Seeding landlords...');
    const landlords = [];
    for (let i = 1; i <= 10; i++) {
      const pad = String(i).padStart(2, '0');
      const landlord = await User.create({
        fullName: `Chủ nhà Nguyễn Văn ${pad}`,
        email: `landlord${pad}@roomhub.vn`,
        phone: `09222222${pad}`,
        password: landlordPassword,
        role: 'landlord',
        status: 'active',
        address: 'Thủ Đức, TP.HCM',
        emailVerifiedAt: new Date(),
      });
      landlords.push(landlord);
    }

    // 5. Create Tenants (30 accounts)
    console.log('Seeding tenants...');
    const tenants = [];
    for (let i = 1; i <= 30; i++) {
      const pad = String(i).padStart(2, '0');
      const tenant = await User.create({
        fullName: `Sinh viên Lê Thị ${pad}`,
        email: `tenant${pad}@roomhub.vn`,
        phone: `09333333${pad}`,
        password: tenantPassword,
        role: 'tenant',
        status: 'active',
        address: 'Khu đô thị ĐHQG TP.HCM',
        emailVerifiedAt: new Date(),
      });
      tenants.push(tenant);
    }

    // 6. Seed RoomTypes
    console.log('Seeding room types...');
    const seededRoomTypes = [];
    for (const type of ROOM_TYPES_DATA) {
      const slug = type.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const doc = await RoomType.create({ ...type, slug });
      seededRoomTypes.push(doc);
    }

    // 7. Seed Amenities
    console.log('Seeding amenities...');
    const seededAmenities = [];
    for (const am of AMENITIES_DATA) {
      const slug = am.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const doc = await Amenity.create({ ...am, slug });
      seededAmenities.push(doc);
    }

    // 8. Seed Rooms (150 listings)
    console.log('Seeding 150 room listings...');
    const rooms = [];
    const moderationOptions = ['approved', 'approved', 'approved', 'approved', 'pending', 'rejected'];
    const statusOptions = ['available', 'available', 'available', 'rented', 'hidden'];

    for (let i = 1; i <= 150; i++) {
      const landlord = landlords[Math.floor(Math.random() * landlords.length)];
      const type = seededRoomTypes[Math.floor(Math.random() * seededRoomTypes.length)];
      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const detailAddress = loc.details[Math.floor(Math.random() * loc.details.length)] + ` (Phòng ${i})`;

      // Random price based on type
      let price = 2500000;
      let area = 22;
      if (type.name === 'Ký túc xá') { price = 900000; area = 45; }
      else if (type.name === 'Căn hộ mini') { price = 4200000; area = 32; }
      else if (type.name === 'Chung cư') { price = 6500000; area = 55; }
      else if (type.name === 'Nhà nguyên căn') { price = 9500000; area = 80; }

      // Random offset to keep prices realistic but diverse
      price += (Math.floor(Math.random() * 5) - 2) * 100000;
      area += Math.floor(Math.random() * 6) - 3;

      // Seed length and width dynamically based on area
      let width = 4;
      if (type.name === 'Ký túc xá') width = 5;
      else if (type.name === 'Căn hộ mini') width = 4;
      else if (type.name === 'Chung cư') width = 5;
      else if (type.name === 'Nhà nguyên căn') width = 5;
      let length = Math.round((area / width) * 10) / 10;

      const randomImages = [];
      const imagesCount = 3 + Math.floor(Math.random() * 3); // 3-5 images
      for (let j = 0; j < imagesCount; j++) {
        randomImages.push({
          url: ROOM_IMAGES[(i + j) % ROOM_IMAGES.length],
          isMain: j === 0,
          order: j,
        });
      }

      // Select random amenities
      const roomAmenities = [];
      const amsCount = 3 + Math.floor(Math.random() * 4); // 3-6 amenities
      const shuffledAms = [...seededAmenities].sort(() => 0.5 - Math.random());
      for (let k = 0; k < amsCount; k++) {
        roomAmenities.push(shuffledAms[k]._id);
      }

      const status = statusOptions[i % statusOptions.length];
      const moderationStatus = moderationOptions[i % moderationOptions.length];

      const room = await Room.create({
        title: `${type.name} cao cấp đầy đủ tiện ích gần ${loc.details[0].split(',')[0]}`,
        slug: `room-listing-slug-${i}-${Date.now()}`,
        description: `Thông tin mô tả phòng trọ thứ ${i}. Phòng mới xây, sạch sẽ, thoáng mát, khu vực an ninh cao. Rất gần trường đại học, trạm xe buýt và các cửa hàng tiện lợi. Có bảo vệ giữ xe tầng trệt và camera giám sát 24/24.`,
        rules: 'Không làm ồn sau 23 giờ. Giữ gìn vệ sinh khu vực chung. Thanh toán tiền phòng đúng hạn đầu tháng.',
        type: type._id,
        landlord: landlord._id,
        price,
        deposit: price,
        electricityFee: 3500,
        waterFee: 100000,
        internetFee: 50000,
        serviceFee: 50000,
        area,
        length,
        width,
        maxOccupants: type.name === 'Ký túc xá' ? 8 : 3,
        address: {
          province: loc.province,
          district: loc.district,
          ward: loc.ward,
          detail: detailAddress,
          lat: 10.878 + (Math.random() - 0.5) * 0.02,
          lng: 106.806 + (Math.random() - 0.5) * 0.02,
        },
        amenities: roomAmenities,
        images: randomImages,
        status: moderationStatus === 'approved' ? status : 'available',
        moderationStatus,
        allowPets: i % 2 === 0,
        freeHours: i % 3 === 0,
        views: 50 + Math.floor(Math.random() * 400),
        favoriteCount: Math.floor(Math.random() * 30),
      });

      rooms.push(room);
    }

    // 9. Seed Favorites (30 entries)
    console.log('Seeding favorites...');
    for (let i = 0; i < 30; i++) {
      const tenant = tenants[i % tenants.length];
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      try {
        await Favorite.create({ tenant: tenant._id, room: room._id });
      } catch (e) {
        // Prevent compound key unique collisions in random seeding
      }
    }

    // 10. Seed RentalRequests (15 requests)
    console.log('Seeding rental requests...');
    const seededRequests = [];
    const requestStatusOptions = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'];

    for (let i = 0; i < 15; i++) {
      const tenant = tenants[i % tenants.length];
      const room = rooms[i * 10 % rooms.length]; // spread listings
      const status = requestStatusOptions[i % requestStatusOptions.length];

      // Fix room status to match completion
      if (status === 'completed') {
        room.status = 'rented';
        await room.save();
      }

      const req = await RentalRequest.create({
        room: room._id,
        tenant: tenant._id,
        landlord: room.landlord,
        status,
        message: `Tôi muốn liên hệ xem phòng trọ vào cuối tuần này.`,
        viewingDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        landlordNote: status === 'rejected' ? 'Rất tiếc thời gian này tôi có lịch bận.' : '',
      });
      seededRequests.push(req);
    }

    // 11. Seed Reviews (5 reviews for completed transactions)
    console.log('Seeding reviews...');
    const completedReqs = seededRequests.filter((r) => r.status === 'completed');
    for (let i = 0; i < completedReqs.length; i++) {
      const req = completedReqs[i];
      await Review.create({
        room: req.room,
        tenant: req.tenant,
        rentalRequest: req._id,
        rating: 4 + (i % 2), // 4 or 5 star reviews
        comment: `Phòng trọ rất sạch sẽ, chủ nhà cực kỳ thân thiện và nhiệt tình hỗ trợ. Tiện nghi đúng như bài đăng mô tả.`,
      });
    }

    // 12. Seed Reports (3 reports of violations)
    console.log('Seeding reports...');
    const reportReasons = ['wrong_price', 'wrong_info', 'scam'];
    for (let i = 0; i < 3; i++) {
      const tenant = tenants[i % tenants.length];
      const room = rooms[(i + 5) * 10 % rooms.length];
      await Report.create({
        reporter: tenant._id,
        room: room._id,
        reason: reportReasons[i],
        description: `Báo cáo vi phạm bài đăng thứ ${i}. Giá cả thực tế khác biệt so với nội dung hiển thị trên sàn RoomHub.`,
        status: 'pending',
      });
    }

    // 13. Seed Notifications for users (10 entries)
    console.log('Seeding notifications...');
    for (let i = 0; i < 10; i++) {
      const tenant = tenants[i % tenants.length];
      await Notification.create({
        recipient: tenant._id,
        type: 'auth',
        title: 'Đăng ký thành công',
        body: 'Chúc mừng bạn đã tạo tài khoản thành công tại RoomHub! Hãy tìm căn phòng mơ ước của bạn.',
      });
    }

    console.log('===================================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`Seeded Records count:`);
    console.log(`- Admin: 1`);
    console.log(`- Landlords: 10`);
    console.log(`- Tenants: 30`);
    console.log(`- Room Listings: 150`);
    console.log(`- Rental Requests: 15`);
    console.log(`- Reviews: ${completedReqs.length}`);
    console.log(`- Violation Reports: 3`);
    console.log('===================================================');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed with error:', error);
    process.exit(1);
  }
};

seedDatabase();
