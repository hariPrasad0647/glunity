const ReplyService = require('../services/reply.service');
const { success, error } = require('../../../utils/response');

const addReplyController = async (req, res, next) => {
  try {
    const reply = await ReplyService.addReply(
      req.user.id,
      req.contentType,
      req.params.id,
      req.body.text
    );
    return success(res, 201, 'Reply added', reply);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getRepliesController = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await ReplyService.getReplies(
      req.contentType,
      req.params.id,
      req.user.id,
      { page, limit }
    );
    return success(res, 200, 'Replies fetched', result);
  } catch (err) {
    next(err);
  }
};

const addNestedReplyController = async (req, res, next) => {
  try {
    const reply = await ReplyService.addReply(
      req.user.id,
      req.contentType,
      req.params.id,
      req.body.text,
      req.params.replyId
    );
    return success(res, 201, 'Reply added', reply);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getNestedRepliesController = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await ReplyService.getNestedReplies(
      req.params.replyId,
      req.user.id,
      { page, limit }
    );
    return success(res, 200, 'Nested replies fetched', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const deleteReplyController = async (req, res, next) => {
  try {
    const result = await ReplyService.deleteReply(req.params.replyId, req.user.id);
    if (result.notFound) return error(res, 404, 'Reply not found');
    if (result.forbidden) return error(res, 403, 'You can only delete your own replies');
    return success(res, 200, 'Reply deleted');
  } catch (err) {
    next(err);
  }
};

const likeReplyController = async (req, res, next) => {
  try {
    const result = await ReplyService.toggleReplyLike(req.user.id, req.params.replyId);
    return success(res, 200, result.liked ? 'Reply liked' : 'Reply unliked', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

module.exports = {
  addReplyController,
  getRepliesController,
  addNestedReplyController,
  getNestedRepliesController,
  deleteReplyController,
  likeReplyController,
};
