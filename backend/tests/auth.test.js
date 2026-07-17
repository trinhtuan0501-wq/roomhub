const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/authRoutes');
const User = require('../src/models/User');
const sendEmail = require('../src/utils/email');

// Mock User model, Notification model & email sender
jest.mock('../src/models/User');
jest.mock('../src/models/Notification');
jest.mock('../src/utils/email');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should fail if fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@roomhub.vn' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Tất cả các trường thông tin');
    });

    it('should fail if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'invalid-email',
          phone: '0987654321',
          password: 'Password@123',
          confirmPassword: 'Password@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Email không đúng định dạng');
    });

    it('should register successfully if input is valid', async () => {
      User.findOne.mockResolvedValue(null);
      User.prototype.save = jest.fn().mockResolvedValue({
        _id: 'mock_user_id',
        fullName: 'Test User',
        email: 'test@roomhub.vn',
      });
      sendEmail.mockResolvedValue({ message: 'sent' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test@roomhub.vn',
          phone: '0987654321',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          role: 'tenant',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Đăng ký tài khoản thành công');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully with correct credentials', async () => {
      const mockUser = {
        _id: 'mock_user_id',
        fullName: 'Test User',
        email: 'test@roomhub.vn',
        phone: '0987654321',
        role: 'tenant',
        status: 'active',
        refreshTokens: [],
        comparePassword: jest.fn().mockResolvedValue(true),
        isLocked: jest.fn().mockReturnValue(false),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@roomhub.vn',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.fullName).toBe('Test User');
    });

    it('should fail with incorrect password', async () => {
      const mockUser = {
        _id: 'mock_user_id',
        email: 'test@roomhub.vn',
        loginAttempts: 0,
        comparePassword: jest.fn().mockResolvedValue(false),
        isLocked: jest.fn().mockReturnValue(false),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@roomhub.vn',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Thông tin đăng nhập không chính xác');
    });
  });
});
