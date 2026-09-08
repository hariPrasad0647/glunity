const path = require('path');
const { createUpload } = require('../config/multer');
const { uploadToBunny } = require('../config/bunny');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

const imageUpload = createUpload(IMAGE_EXTS, parseInt(process.env.MAX_FILE_SIZE) || 5242880);
const reelUpload = createUpload(
  [...VIDEO_EXTS, ...IMAGE_EXTS],
  parseInt(process.env.MAX_VIDEO_SIZE) || 104857600
);
const chatUpload = createUpload(
  [...IMAGE_EXTS, ...VIDEO_EXTS],
  parseInt(process.env.MAX_VIDEO_SIZE) || 104857600
);
// 50 MB cap for profile banner (image or short video ≤ 15 s — duration enforced client-side)
const bannerUpload = createUpload(
  [...IMAGE_EXTS, ...VIDEO_EXTS],
  parseInt(process.env.MAX_BANNER_SIZE) || 52428800
);

const handleMulterError = (err, res, { videoMode = false, expectedFields = [] } = {}) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    const limit = videoMode ? '100MB' : '5MB';
    return error(res, 413, `File too large. Maximum allowed size is ${limit}`);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const expected = expectedFields.length
      ? ` Expected field name${expectedFields.length > 1 ? 's' : ''}: ${expectedFields.map((f) => `"${f}"`).join(', ')}.`
      : '';
    return error(res, 400, `Unexpected form field "${err.field}".${expected}`);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return error(res, 400, 'Too many files uploaded');
  }
  return error(res, 400, err.message);
};

// ── Profile media (avatar + banner in one pass) ───────────────────────────────
// Uses .fields() so both profileImage and banner are parsed from the same
// multipart body. Chaining two separate single() calls does NOT work because
// the first multer middleware consumes the entire request body.

const profileMediaUpload = createUpload(
  [...IMAGE_EXTS, ...VIDEO_EXTS],
  parseInt(process.env.MAX_BANNER_SIZE) || 52428800 // 50 MB covers both fields
);

const uploadProfileMedia = (req, res, next) => {
  profileMediaUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return handleMulterError(err, res, { videoMode: true, expectedFields: ['profileImage', 'banner'] });

    const files = req.files || {};

    try {
      const timestamp = Date.now();

      // ── Profile avatar (images only) ────────────────────────────────────────
      if (files.profileImage && files.profileImage[0]) {
        const imgFile = files.profileImage[0];
        const ext = path.extname(imgFile.originalname).toLowerCase();
        if (!IMAGE_EXTS.includes(ext)) {
          return error(res, 400, `Unsupported profile image type "${ext}". Allowed: ${IMAGE_EXTS.join(', ')}`);
        }
        if (imgFile.size > (parseInt(process.env.MAX_FILE_SIZE) || 5242880)) {
          return error(res, 413, 'Profile image too large. Maximum allowed size is 5MB');
        }
        const filename = `${req.user.id}_${timestamp}${ext}`;
        imgFile.cdnUrl = await uploadToBunny(imgFile.buffer, `profile-images/${filename}`);
        // Attach to req.file for backward-compat with the service layer
        req.file = imgFile;
      }

      // ── Profile banner (image or video) ────────────────────────────────────
      if (files.banner && files.banner[0]) {
        const bannerFile = files.banner[0];
        const ext = path.extname(bannerFile.originalname).toLowerCase();
        const isVideo = VIDEO_EXTS.includes(ext);
        const folder = isVideo ? 'profile-banners/videos' : 'profile-banners/images';
        const filename = `${req.user.id}_${timestamp}${ext}`;
        const bannerUrl = await uploadToBunny(bannerFile.buffer, `${folder}/${filename}`);
        req.bannerUpload = { bannerUrl, bannerType: isVideo ? 'video' : 'image' };
      }

      next();
    } catch (uploadErr) {
      logger.error('uploadProfileMedia failed:', uploadErr);
      return error(res, 500, 'Failed to upload profile media. Please try again.');
    }
  });
};

// ── Post media (images or videos, up to 10) ───────────────────────────────────

const postMediaUpload = createUpload(
  [...IMAGE_EXTS, ...VIDEO_EXTS],
  parseInt(process.env.MAX_VIDEO_SIZE) || 104857600
);

const uploadPostMedia = (req, res, next) => {
  postMediaUpload.array('media', 10)(req, res, async (err) => {
    if (err) return handleMulterError(err, res, { videoMode: true, expectedFields: ['media'] });
    if (!req.files || req.files.length === 0) return next();
    try {
      const timestamp = Date.now();
      req.cdnUrls = await Promise.all(
        req.files.map((file, i) => {
          const ext = path.extname(file.originalname).toLowerCase();
          return uploadToBunny(file.buffer, `posts/${req.user.id}_${timestamp}_${i}${ext}`);
        })
      );
      next();
    } catch (uploadErr) {
      logger.error('uploadPostMedia failed:', uploadErr);
      return error(res, 500, 'Failed to upload media. Please try again.');
    }
  });
};

// ── Reel (video + optional thumbnail) ────────────────────────────────────────

const uploadReel = (req, res, next) => {
  reelUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return handleMulterError(err, res, { videoMode: true, expectedFields: ['video', 'thumbnail'] });
    if (!req.files || !req.files.video) return next();

    try {
      const timestamp = Date.now();
      const videoFile = req.files.video[0];
      const videoExt = path.extname(videoFile.originalname).toLowerCase();
      const videoPath = `reels/videos/${req.user.id}_${timestamp}${videoExt}`;

      const thumbFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
      const thumbPath = thumbFile
        ? `reels/thumbnails/${req.user.id}_${timestamp}${path.extname(thumbFile.originalname).toLowerCase()}`
        : null;

      const [videoUrl, thumbnailUrl] = await Promise.all([
        uploadToBunny(videoFile.buffer, videoPath),
        thumbFile ? uploadToBunny(thumbFile.buffer, thumbPath) : Promise.resolve(null),
      ]);

      req.reelUpload = { videoUrl, thumbnailUrl };
      next();
    } catch (uploadErr) {
      logger.error('uploadReel failed:', uploadErr);
      return error(res, 500, 'Failed to upload reel. Please try again.');
    }
  });
};

// ── Chat media (single image or video) ───────────────────────────────────────

const uploadChatMedia = (req, res, next) => {
  chatUpload.single('file')(req, res, async (err) => {
    if (err) return handleMulterError(err, res, { videoMode: true, expectedFields: ['file'] });
    if (!req.file) return next();
    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isVideo = VIDEO_EXTS.includes(ext);
      const folder = isVideo ? 'chat/videos' : 'chat/images';
      const filename = `${req.user.id}_${Date.now()}${ext}`;
      const mediaUrl = await uploadToBunny(req.file.buffer, `${folder}/${filename}`);
      req.chatUpload = { mediaUrl, mediaType: isVideo ? 'video' : 'image' };
      next();
    } catch (uploadErr) {
      logger.error('uploadChatMedia failed:', uploadErr);
      return error(res, 500, 'Failed to upload file. Please try again.');
    }
  });
};

// ── Story (single image or video, 24-hour lifespan) ───────────────────────────

const uploadStory = (req, res, next) => {
  chatUpload.single('file')(req, res, async (err) => {
    if (err) return handleMulterError(err, res, { videoMode: true, expectedFields: ['file'] });
    if (!req.file) return next();
    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isVideo = VIDEO_EXTS.includes(ext);
      const folder = isVideo ? 'stories/videos' : 'stories/images';
      const filename = `${req.user.id}_${Date.now()}${ext}`;
      const mediaUrl = await uploadToBunny(req.file.buffer, `${folder}/${filename}`);
      req.storyUpload = { mediaUrl, mediaType: isVideo ? 'video' : 'image' };
      next();
    } catch (uploadErr) {
      logger.error('uploadStory failed:', uploadErr);
      return error(res, 500, 'Failed to upload story. Please try again.');
    }
  });
};

// ── Unified content (post images OR reel video+thumbnail) ────────────────────

const uploadContent = (req, res, next) => {
  reelUpload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return handleMulterError(err, res, { videoMode: true, expectedFields: ['images', 'video', 'thumbnail'] });

    const files = req.files || {};
    const hasImages = files.images && files.images.length > 0;
    const hasVideo = files.video && files.video.length > 0;

    if (hasImages && hasVideo) {
      return error(res, 400, 'Send either images or a video, not both');
    }
    if (!hasImages && !hasVideo) {
      req.contentType = 'post';
      return next();
    }

    try {
      const timestamp = Date.now();

      if (hasVideo) {
        const videoFile = files.video[0];
        const videoExt = path.extname(videoFile.originalname).toLowerCase();
        const videoPath = `reels/videos/${req.user.id}_${timestamp}${videoExt}`;

        const thumbFile = files.thumbnail ? files.thumbnail[0] : null;
        const thumbPath = thumbFile
          ? `reels/thumbnails/${req.user.id}_${timestamp}${path.extname(thumbFile.originalname).toLowerCase()}`
          : null;

        const [videoUrl, thumbnailUrl] = await Promise.all([
          uploadToBunny(videoFile.buffer, videoPath),
          thumbFile ? uploadToBunny(thumbFile.buffer, thumbPath) : Promise.resolve(null),
        ]);

        req.contentType = 'reel';
        req.reelUpload = { videoUrl, thumbnailUrl };
      } else {
        req.contentType = 'post';
        req.cdnUrls = await Promise.all(
          files.images.map((file, i) => {
            const ext = path.extname(file.originalname).toLowerCase();
            return uploadToBunny(file.buffer, `posts/${req.user.id}_${timestamp}_${i}${ext}`);
          })
        );
      }

      next();
    } catch (uploadErr) {
      logger.error('uploadContent failed:', uploadErr);
      return error(res, 500, 'Failed to upload content. Please try again.');
    }
  });
};

module.exports = {
  uploadProfileMedia,
  uploadPostMedia,
  uploadReel,
  uploadChatMedia,
  uploadStory,
  uploadContent,
};
