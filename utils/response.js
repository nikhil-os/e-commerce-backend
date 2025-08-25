const success = (res, message, data = {}) => {
  return res.status(200).json({ success: true, message, data });
};

const error = (res, message, code = 500, errors = []) => {
  return res.status(code).json({ success: false, message, errors });
};

module.exports = { success, error };
