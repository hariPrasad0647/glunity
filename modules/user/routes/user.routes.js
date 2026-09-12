const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uuidParam, requiredQuery } = require('../../../utils/paramValidators');
const { uploadProfileMedia } = require('../../../middleware/upload');
const { updateProfileValidator, saveInterestsValidator } = require('../validators/user.validator');
const {
  updateProfileController,
  saveInterestsController,
  getInterestsController,
  followController,
  unfollowController,

  getFollowersController,
  getFollowingController,
  getFriendsController,
  getSuggestionsController,
  getSavedPostsController,
  getSavedReelsController,
  getUserProfileController,
  getUserFollowersController,
  getUserFollowingController,
  searchUsersController,
  getUserPostsController,
  getUserReelsController,
  getMeController,
  getMyPostsController,
  getMyReelsController,
  getMyLikedPostsController,
  getMyLikedReelsController,
  getMyCommentsController,
  getMyRepostedPostsController,
  getMyRepostedReelsController,
  getUserRepostedPostsController,
  getUserRepostedReelsController,
} = require('../controllers/user.controller');

// PATCH /api/users/profile
router.patch(
    '/profile',
    auth,
    uploadProfileMedia,
    updateProfileValidator,
    validate,
    updateProfileController
);

// POST /api/users/interests
router.post('/interests', auth, saveInterestsValidator, validate, saveInterestsController);

// GET /api/users/interests
router.get('/interests', auth, getInterestsController);



// ── Follower / following / friends lists ──────────────────────────────────────

router.get('/followers', auth, getFollowersController);
router.get('/following', auth, getFollowingController);
router.get('/friends', auth, getFriendsController);
router.get('/suggestions', auth, getSuggestionsController);

// GET /api/users/search?q=...
router.get('/search', auth, requiredQuery('q'), validate, searchUsersController);

// ── Saved content ─────────────────────────────────────────────────────────────
router.get('/saved/posts', auth, getSavedPostsController);
router.get('/saved/reels', auth, getSavedReelsController);

// ── My own profile (Instagram-style: bio + posts + reels in one call) ────────
// Must stay above /:id to prevent Express matching 'me' as :id

// GET /api/users/me — profile + first page of posts + first page of reels
router.get('/me', auth, getMeController);

// GET /api/users/me/posts — paginated own posts
router.get('/me/posts', auth, getMyPostsController);

// GET /api/users/me/reels — paginated own reels
router.get('/me/reels', auth, getMyReelsController);

// ── My Activity ─────────────────────────────────────────────────────────────
router.get('/me/liked/posts', auth, getMyLikedPostsController);
router.get('/me/liked/reels', auth, getMyLikedReelsController);
router.get('/me/reposted/posts', auth, getMyRepostedPostsController);
router.get('/me/reposted/reels', auth, getMyRepostedReelsController);
router.get('/me/comments', auth, getMyCommentsController);

// ── Public profile viewing ────────────────────────────────────────────────────
// These must stay above /:id/follow to prevent Express matching 'posts'/'reels' as :id

// GET /api/users/:id
router.get('/:id', auth, uuidParam('id'), validate, getUserProfileController);

// GET /api/users/:id/posts
router.get('/:id/posts', auth, uuidParam('id'), validate, getUserPostsController);

// GET /api/users/:id/reels
router.get('/:id/reels', auth, uuidParam('id'), validate, getUserReelsController);

// GET /api/users/:id/reposted/posts
router.get('/:id/reposted/posts', auth, uuidParam('id'), validate, getUserRepostedPostsController);

// GET /api/users/:id/reposted/reels
router.get('/:id/reposted/reels', auth, uuidParam('id'), validate, getUserRepostedReelsController);

// GET /api/users/:id/followers
router.get('/:id/followers', auth, uuidParam('id'), validate, getUserFollowersController);

// GET /api/users/:id/following
router.get('/:id/following', auth, uuidParam('id'), validate, getUserFollowingController);

// ── Follow / unfollow a user ──────────────────────────────────────────────────

// POST   /api/users/:id/follow
router.post('/:id/follow', auth, uuidParam('id'), validate, followController);

// DELETE /api/users/:id/follow
router.delete('/:id/follow', auth, uuidParam('id'), validate, unfollowController);

module.exports = router;
