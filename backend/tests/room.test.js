const request = require('supertest');
const express = require('express');
const roomRoutes = require('../src/routes/roomRoutes');
const Room = require('../src/models/Room');
const { protect, restrictTo, isVerified } = require('../src/middleware/authMiddleware');

// Mock Room model
jest.mock('../src/models/Room', () => {
  const mockRoom = jest.fn().mockImplementation((data) => {
    return {
      _id: 'mock_room_id',
      ...data,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };
  });

  mockRoom.find = jest.fn();
  mockRoom.countDocuments = jest.fn();
  mockRoom.findById = jest.fn();

  return mockRoom;
});

jest.mock('../src/middleware/authMiddleware', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { id: 'mock_landlord_id', role: 'landlord', status: 'active' };
    next();
  }),
  restrictTo: jest.fn(() => (req, res, next) => next()),
  isVerified: jest.fn((req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api/rooms', roomRoutes);

describe('Room API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rooms', () => {
    it('should return list of available and approved rooms', async () => {
      const mockRooms = [
        { _id: 'room1', title: 'Phòng trọ đẹp ở Thủ Đức', price: 2500000, area: 25 },
        { _id: 'room2', title: 'Căn hộ dịch vụ Dĩ An', price: 4000000, area: 35 },
      ];

      Room.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockRooms),
      });

      Room.countDocuments.mockResolvedValue(2);

      const res = await request(app).get('/api/rooms');

      expect(res.status).toBe(200);
      expect(res.body.rooms).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('POST /api/rooms', () => {
    it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send({ title: 'Phòng trọ giá rẻ' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Thông tin phòng không được để trống');
    });

    it('should create room successfully with valid data', async () => {
      const validRoomData = {
        title: 'Căn hộ Mini Làng Đại Học',
        description: 'Phòng mới xây gần Đại học Quốc gia, đầy đủ tiện nghi.',
        type: '507f1f087c5011de0b71837f', // Mock object ID
        price: 3000000,
        deposit: 3000000,
        area: 30,
        maxOccupants: 3,
        address: {
          province: 'Bình Dương',
          district: 'Dĩ An',
          ward: 'Đông Hòa',
          detail: 'Số 10, Đường 2, Khu phố Tân Lập',
        },
      };



      const res = await request(app)
        .post('/api/rooms')
        .send(validRoomData);

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Tạo bài đăng phòng thành công');
      expect(res.body.room).toBeDefined();
    });
  });
});
