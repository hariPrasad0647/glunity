const { Op } = require('sequelize');
const Follow = require('../../user/models/follow.model');
const Interest = require('../../user/models/interest.model');
const User = require('../../user/models/user.model');
const Post = require('../../post/models/post.model');
const PostMedia = require('../../post/models/post_media.model');
const PostMention = require('../../post/models/post_mention.model');
const Hashtag = require('../../post/models/hashtag.model');
const Reel = require('../../reel/models/reel.model');
const ReelMention = require('../../reel/models/reel_mention.model');
const Like = require('../../post/models/like.model');
const Bookmark = require('../../post/models/bookmark.model');

// Ensure hashtag join-table associations are registered
require('../../post/models/post_hashtag.model');
require('../../reel/models/reel_hashtag.model');

const LOOKBACK_DAYS = 14;
const FETCH_MULTIPLIER = 5;

// ── Scoring ────────────────────────────────────────────────────────────────────
const computeScore = ({ createdAt, likeCount, bookmarkCount, repostCount, interestMatch, isFollowing }) => {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const timeFactor = 1 / Math.pow(hoursOld + 2, 1.2);
  const engagement = likeCount + bookmarkCount * 2 + repostCount * 1.5;
  const interestBonus = interestMatch ? 1.5 : 1.0;
  const relationshipBonus = isFollowing ? 2.0 : 1.0;
  return (engagement * interestBonus + 0.1) * timeFactor * relationshipBonus;
};

const postIncludes = [
  { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'profileImage'] },
  { model: PostMedia, as: 'media', attributes: ['mediaUrl', 'order'] },
  { model: Hashtag, as: 'hashtags', attributes: ['name'], through: { attributes: [] } },
  {
    model: PostMention, as: 'mentions',
    include: [{ model: User, as: 'mentionedUser', attributes: ['id', 'username', 'profileImage'] }],
  },
];

const reelIncludes = [
  { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'profileImage'] },
  { model: Hashtag, as: 'hashtags', attributes: ['name'], through: { attributes: [] } },
  {
    model: ReelMention, as: 'mentions',
    include: [{ model: User, as: 'mentionedUser', attributes: ['id', 'username', 'profileImage'] }],
  },
];

const getFeed = async (userId, { page = 1, limit = 20 } = {}) => {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const fetchLimit = limit * FETCH_MULTIPLIER;

  const [followingRows, interestRows] = await Promise.all([
    Follow.findAll({ where: { followerId: userId, status: 'accepted' }, attributes: ['followingId'], raw: true }),
    Interest.findAll({ where: { userId }, attributes: ['interest'], raw: true }),
  ]);

  const followingIds = followingRows.map((f) => f.followingId);
  const followingSet = new Set(followingIds);
  const userInterests = new Set(interestRows.map((i) => i.interest.toLowerCase()));

  const baseWhere = { createdAt: { [Op.gte]: since }, isPrivate: false };

  let posts = [], reels = [];
  if (followingIds.length > 0) {
    [posts, reels] = await Promise.all([
      Post.findAll({ where: { ...baseWhere, userId: { [Op.in]: followingIds } }, include: postIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
      Reel.findAll({ where: { ...baseWhere, userId: { [Op.in]: followingIds } }, include: reelIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
    ]);
  }

  let suggestedPosts = [], suggestedReels = [];
  if (posts.length + reels.length < limit) {
    const excludeIds = followingIds.length ? [...followingIds, userId] : [userId];
    [suggestedPosts, suggestedReels] = await Promise.all([
      Post.findAll({ where: { ...baseWhere, userId: { [Op.notIn]: excludeIds } }, include: postIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
      Reel.findAll({ where: { ...baseWhere, userId: { [Op.notIn]: excludeIds } }, include: reelIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
    ]);
  }

  const allPosts = [...posts, ...suggestedPosts];
  const allReels = [...reels, ...suggestedReels];
  if (allPosts.length === 0 && allReels.length === 0) return { feed: [], page, limit, hasMore: false };

  const allIds = [...allPosts.map((p) => p.id), ...allReels.map((r) => r.id)];

  const [vLikeRows, vBookmarkRows] = await Promise.all([
    Like.findAll({ where: { userId, contentId: { [Op.in]: allIds } }, attributes: ['contentId'], raw: true }),
    Bookmark.findAll({ where: { userId, contentId: { [Op.in]: allIds } }, attributes: ['contentId'], raw: true }),
  ]);

  const viewerLiked = new Set(vLikeRows.map((r) => r.contentId));
  const viewerBookmarked = new Set(vBookmarkRows.map((r) => r.contentId));

  const items = [];

  allPosts.forEach((post) => {
    const isFollowing = followingSet.has(post.userId);
    const interestMatch = post.hashtags.some((h) => userInterests.has(h.name.toLowerCase()));

    items.push({
      _score: computeScore({ createdAt: post.createdAt, likeCount: post.likeCount, bookmarkCount: post.bookmarkCount, repostCount: post.repostCount, interestMatch, isFollowing }),
      type: 'post',
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      author: { id: post.author.id, username: post.author.username, fullName: post.author.fullName, profileImage: post.author.profileImage || null },
      media: post.media.sort((a, b) => a.order - b.order).map((m) => m.mediaUrl),
      hashtags: post.hashtags.map((h) => h.name),
      mentions: post.mentions.map((m) => ({ id: m.mentionedUser.id, username: m.mentionedUser.username, profileImage: m.mentionedUser.profileImage || null })),
      likeCount: post.likeCount, bookmarkCount: post.bookmarkCount, repostCount: post.repostCount, replyCount: post.replyCount,
      hasLiked: viewerLiked.has(post.id),
      hasBookmarked: viewerBookmarked.has(post.id),
      isFromFollowing: isFollowing,
    });
  });

  allReels.forEach((reel) => {
    const isFollowing = followingSet.has(reel.userId);
    const interestMatch = reel.hashtags.some((h) => userInterests.has(h.name.toLowerCase()));

    items.push({
      _score: computeScore({ createdAt: reel.createdAt, likeCount: 0, bookmarkCount: 0, repostCount: 0, interestMatch, isFollowing }),
      type: 'reel',
      id: reel.id,
      videoUrl: reel.videoUrl,
      thumbnailUrl: reel.thumbnailUrl || null,
      caption: reel.caption,
      createdAt: reel.createdAt,
      author: { id: reel.author.id, username: reel.author.username, fullName: reel.author.fullName, profileImage: reel.author.profileImage || null },
      hashtags: reel.hashtags.map((h) => h.name),
      mentions: reel.mentions.map((m) => ({ id: m.mentionedUser.id, username: m.mentionedUser.username, profileImage: m.mentionedUser.profileImage || null })),
      likeCount: 0, bookmarkCount: 0, repostCount: 0, replyCount: 0,
      hasLiked: viewerLiked.has(reel.id),
      hasBookmarked: viewerBookmarked.has(reel.id),
      isFromFollowing: isFollowing,
    });
  });

  items.sort((a, b) => b._score - a._score);

  const offset = (page - 1) * limit;
  const paginated = items.slice(offset, offset + limit).map(({ _score, ...item }) => item);

  return { feed: paginated, page, limit, hasMore: offset + limit < items.length };
};

const HOME_FETCH_MULTIPLIER = 3;

const formatFeedPost = (post, viewerLiked, viewerBookmarked) => ({
  type: 'post',
  id: post.id,
  content: post.content,
  createdAt: post.createdAt,
  author: { id: post.author.id, username: post.author.username, fullName: post.author.fullName, profileImage: post.author.profileImage || null },
  media: post.media.sort((a, b) => a.order - b.order).map((m) => m.mediaUrl),
  hashtags: post.hashtags.map((h) => h.name),
  mentions: post.mentions.map((m) => ({ id: m.mentionedUser.id, username: m.mentionedUser.username, profileImage: m.mentionedUser.profileImage || null })),
  likeCount: post.likeCount || 0,
  bookmarkCount: post.bookmarkCount || 0,
  repostCount: post.repostCount || 0,
  replyCount: post.replyCount || 0,
  hasLiked: viewerLiked.has(post.id),
  hasBookmarked: viewerBookmarked.has(post.id),
});

const formatFeedReel = (reel, viewerLiked, viewerBookmarked) => ({
  type: 'reel',
  id: reel.id,
  videoUrl: reel.videoUrl,
  thumbnailUrl: reel.thumbnailUrl || null,
  caption: reel.caption,
  createdAt: reel.createdAt,
  author: { id: reel.author.id, username: reel.author.username, fullName: reel.author.fullName, profileImage: reel.author.profileImage || null },
  hashtags: reel.hashtags.map((h) => h.name),
  mentions: reel.mentions.map((m) => ({ id: m.mentionedUser.id, username: m.mentionedUser.username, profileImage: m.mentionedUser.profileImage || null })),
  likeCount: 0,
  bookmarkCount: 0,
  repostCount: 0,
  replyCount: 0,
  hasLiked: viewerLiked.has(reel.id),
  hasBookmarked: viewerBookmarked.has(reel.id),
});

const attachHomeStats = async (viewerId, posts, reels) => {
  const allIds = [...posts.map((p) => p.id), ...reels.map((r) => r.id)];
  if (allIds.length === 0) return [];

  const [vLikeRows, vBookmarkRows] = await Promise.all([
    Like.findAll({ where: { userId: viewerId, contentId: { [Op.in]: allIds } }, attributes: ['contentId'], raw: true }),
    Bookmark.findAll({ where: { userId: viewerId, contentId: { [Op.in]: allIds } }, attributes: ['contentId'], raw: true }),
  ]);

  const viewerLiked = new Set(vLikeRows.map((r) => r.contentId));
  const viewerBookmarked = new Set(vBookmarkRows.map((r) => r.contentId));

  const items = [
    ...posts.map((p) => formatFeedPost(p, viewerLiked, viewerBookmarked)),
    ...reels.map((r) => formatFeedReel(r, viewerLiked, viewerBookmarked)),
  ];
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return items;
};

const getHomeFeed = async (userId, { page = 1, limit = 10 } = {}) => {
  page = Math.max(1, page);
  limit = Math.max(1, limit);

  if (page === 1) {
    const [posts, reels] = await Promise.all([
      Post.findAll({ where: { userId }, include: postIncludes, order: [['createdAt', 'DESC']], limit }),
      Reel.findAll({ where: { userId }, include: reelIncludes, order: [['createdAt', 'DESC']], limit }),
    ]);
    const items = (await attachHomeStats(userId, posts, reels)).slice(0, limit).map((item) => ({ ...item, isOwn: true }));

    const followingCount = await Follow.count({ where: { followerId: userId, status: 'accepted' } });

    return { feed: items, page, limit, hasMore: followingCount > 0 };
  }

  const followingRows = await Follow.findAll({ where: { followerId: userId, status: 'accepted' }, attributes: ['followingId'], raw: true });
  const followingIds = followingRows.map((f) => f.followingId);
  if (followingIds.length === 0) return { feed: [], page, limit, hasMore: false };

  const offset = (page - 2) * limit;
  const fetchLimit = offset + limit * HOME_FETCH_MULTIPLIER;
  const where = { userId: { [Op.in]: followingIds }, isPrivate: false };

  const [posts, reels] = await Promise.all([
    Post.findAll({ where, include: postIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
    Reel.findAll({ where, include: reelIncludes, order: [['createdAt', 'DESC']], limit: fetchLimit }),
  ]);

  const items = await attachHomeStats(userId, posts, reels);
  const paginated = items.slice(offset, offset + limit).map((item) => ({ ...item, isOwn: false }));

  return { feed: paginated, page, limit, hasMore: items.length > offset + limit };
};

module.exports = { getFeed, getHomeFeed };
