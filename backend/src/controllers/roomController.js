const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Amenity = require('../models/Amenity');
const RentalRequest = require('../models/RentalRequest');
const Favorite = require('../models/Favorite');
const { uploadToCloudinary, deleteImage } = require('../utils/upload');

// Helper to convert Vietnamese string to lowercase, non-accented slug
const slugify = (str) => {
  if (!str) return '';
  let slug = str.toLowerCase();
  slug = slug.replace(/á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a');
  slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e');
  slug = slug.replace(/í|ì|ỉ|ĩ|ị/g, 'i');
  slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o');
  slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u');
  slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y');
  slug = slug.replace(/đ/g, 'd');
  slug = slug.replace(/[^a-z0-9\s-]/g, ''); // Remove special chars
  slug = slug.replace(/\s+/g, '-'); // Replace space with hyphen
  slug = slug.replace(/-+/g, '-'); // Collapse double hyphens
  slug = slug.trim().replace(/^-+|-+$/g, ''); // Trim hyphens
  return slug + '-' + Date.now(); // Append timestamp to prevent duplicate slugs
};

// 1. PUBLIC GET ROOMS (SEARCH & FILTER)
exports.getRooms = async (req, res) => {
  try {
    const {
      q, // Text search
      province,
      district,
      ward,
      type, // room type id
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      maxOccupants,
      amenities, // comma separated ids
      isVerified, // Boolean
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    // Building query
    // Public search should only return approved and available rooms
    const query = {
      status: 'available',
      moderationStatus: 'approved',
    };

    // Text search query or dimensions query
    if (q) {
      // 1. Check dimension pattern like 5x5, 4x5, 5m x 4m, etc.
      const dimMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[xX*×]\s*(\d+(?:\.\d+)?)\s*(?:m)?/);
      // 2. Check length/width queries like "dài 5", "rộng 4"
      const lengthMatch = q.match(/(?:dài|dai|d)\s*(\d+(?:\.\d+)?)/i);
      const widthMatch = q.match(/(?:rộng|rong|r)\s*(\d+(?:\.\d+)?)/i);
      // 3. Check area search like "25m2" or "25 m2"
      const areaMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:m2|m²)/i);

      if (dimMatch) {
        const dim1 = Number(dimMatch[1]);
        const dim2 = Number(dimMatch[2]);
        query.$or = [
          { length: dim1, width: dim2 },
          { length: dim2, width: dim1 }
        ];
      } else if (lengthMatch || widthMatch || areaMatch) {
        const andFilters = [];
        if (lengthMatch) andFilters.push({ length: Number(lengthMatch[1]) });
        if (widthMatch) andFilters.push({ width: Number(widthMatch[1]) });
        if (areaMatch) andFilters.push({ area: Number(areaMatch[1]) });
        
        if (andFilters.length > 0) {
          query.$and = andFilters;
        }
      } else {
        // Fallback to regular text search
        query.$text = { $search: q };
      }
    }

    // Address filter
    if (province) query['address.province'] = province;
    if (district) query['address.district'] = district;
    if (ward) query['address.ward'] = ward;

    // Room Type filter
    if (type) query.type = type;

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Area range
    if (minArea || maxArea) {
      query.area = {};
      if (minArea) query.area.$gte = Number(minArea);
      if (maxArea) query.area.$lte = Number(maxArea);
    }

    // Max occupants
    if (maxOccupants) {
      query.maxOccupants = { $gte: Number(maxOccupants) };
    }

    // Amenities (all specified amenities should be present)
    if (amenities) {
      const amenityArray = amenities.split(',');
      query.amenities = { $all: amenityArray };
    }

    // Sorting
    let sortBy = { createdAt: -1 }; // default: newest
    if (sort) {
      if (sort === 'newest') sortBy = { createdAt: -1 };
      else if (sort === 'oldest') sortBy = { createdAt: 1 };
      else if (sort === 'price_asc') sortBy = { price: 1 };
      else if (sort === 'price_desc') sortBy = { price: -1 };
      else if (sort === 'area_desc') sortBy = { area: -1 };
      else if (sort === 'views') sortBy = { views: -1 };
      else if (sort === 'favorites') sortBy = { favoriteCount: -1 };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const rooms = await Room.find(query)
      .populate('type')
      .populate('amenities')
      .populate('landlord', 'fullName avatar phone')
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum);

    const total = await Room.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      rooms,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. PUBLIC FEATURED ROOMS
exports.getFeaturedRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'available', moderationStatus: 'approved' })
      .populate('type')
      .populate('amenities')
      .sort({ views: -1, favoriteCount: -1 })
      .limit(6);
    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. PUBLIC GET ROOM DETAIL
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('type')
      .populate('amenities')
      .populate('landlord', 'fullName avatar email phone createdAt');

    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy phòng cho thuê hoặc bài đăng đã bị xóa' });
    }

    // Auto increment views
    room.views += 1;
    await room.save();

    res.status(200).json({ room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. PUBLIC GET RELATED ROOMS
exports.getRelatedRooms = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    // Similar rooms: same type OR same province/district OR similar price (+/- 20%)
    const minPrice = room.price * 0.8;
    const maxPrice = room.price * 1.2;

    const related = await Room.find({
      _id: { $ne: room._id },
      status: 'available',
      moderationStatus: 'approved',
      $or: [
        { type: room.type },
        { 'address.province': room.address.province, 'address.district': room.address.district },
        { price: { $gte: minPrice, $lte: maxPrice } },
      ],
    })
      .populate('type')
      .limit(4);

    res.status(200).json({ rooms: related });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. LANDLORD GET MY ROOMS
exports.getLandlordRooms = async (req, res) => {
  try {
    const { status, moderationStatus } = req.query;
    const query = { landlord: req.user.id, status: { $ne: 'deleted' } };

    if (status) query.status = status;
    if (moderationStatus) query.moderationStatus = moderationStatus;

    const rooms = await Room.find(query).populate('type').sort({ createdAt: -1 });
    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. LANDLORD CREATE ROOM
exports.createRoom = async (req, res) => {
  try {
    const roomData = req.body;
    
    // Auto slug creation
    roomData.slug = slugify(roomData.title);
    roomData.landlord = req.user.id;
    roomData.moderationStatus = 'pending'; // Auto submit for moderation upon creation

    const room = new Room(roomData);
    await room.save();

    res.status(201).json({
      message: 'Tạo bài đăng phòng thành công. Bài đăng đang chờ quản trị viên phê duyệt.',
      room,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. LANDLORD UPDATE ROOM
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    // Verify ownership
    if (room.landlord.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa phòng này' });
    }

    const updates = req.body;
    if (updates.title) {
      updates.slug = slugify(updates.title);
    }

    // Reset moderation on updates
    updates.moderationStatus = 'pending';
    updates.moderationNote = '';

    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: 'Cập nhật phòng thành công. Bài viết được gửi duyệt lại.',
      room: updatedRoom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. LANDLORD TOGGLE STATUS (HIDE / UNHIDE)
exports.toggleStatus = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    if (room.landlord.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    room.status = room.status === 'available' ? 'hidden' : 'available';
    await room.save();

    res.status(200).json({
      message: `Đã chuyển trạng thái phòng sang: ${room.status === 'available' ? 'Đang hoạt động' : 'Đã ẩn'}`,
      status: room.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. LANDLORD DELETE ROOM (SOFT DELETE)
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    if (room.landlord.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa phòng này' });
    }

    room.status = 'deleted';
    await room.save();

    res.status(200).json({ message: 'Xóa bài đăng phòng thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 10. LANDLORD UPLOAD ROOM IMAGES
exports.uploadRoomImages = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    if (room.landlord.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa phòng này' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn hình ảnh để tải lên' });
    }

    const uploadPromises = req.files.map((file) => uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);

    const newImages = results.map((res, index) => ({
      url: res.url,
      publicId: res.publicId,
      isMain: room.images.length === 0 && index === 0, // Set first main if empty
      order: room.images.length + index,
    }));

    room.images.push(...newImages);
    await room.save();

    res.status(200).json({
      message: 'Tải ảnh lên thành công',
      images: room.images,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 11. LANDLORD DELETE IMAGE
exports.deleteRoomImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const room = await Room.findById(id);

    if (!room || room.status === 'deleted') {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    if (room.landlord.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa phòng này' });
    }

    const imageIndex = room.images.findIndex((img) => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy hình ảnh' });
    }

    const imageToDelete = room.images[imageIndex];
    
    // Call delete handler
    await deleteImage(imageToDelete.publicId);

    // Remove from array
    room.images.splice(imageIndex, 1);

    // If main image was deleted, make another one main (if available)
    if (imageToDelete.isMain && room.images.length > 0) {
      room.images[0].isMain = true;
    }

    await room.save();

    res.status(200).json({
      message: 'Xóa hình ảnh thành công',
      images: room.images,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 12. LANDLORD STATS
exports.getLandlordStats = async (req, res) => {
  try {
    const landlordId = req.user.id;

    const rooms = await Room.find({ landlord: landlordId, status: { $ne: 'deleted' } });
    
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter((r) => r.status === 'available').length;
    const rentedRooms = rooms.filter((r) => r.status === 'rented').length;
    const pendingApproval = rooms.filter((r) => r.moderationStatus === 'pending').length;

    let totalViews = 0;
    let totalFavorites = 0;
    rooms.forEach((r) => {
      totalViews += r.views || 0;
      totalFavorites += r.favoriteCount || 0;
    });

    const requests = await RentalRequest.find({ landlord: landlordId });
    const totalRequests = requests.length;
    const newRequests = requests.filter((r) => r.status === 'pending').length;

    res.status(200).json({
      stats: {
        totalRooms,
        availableRooms,
        rentedRooms,
        pendingApproval,
        totalViews,
        totalFavorites,
        totalRequests,
        newRequests,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
