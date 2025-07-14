// AdminLog model for RooMe
class AdminLog {
  constructor({ id, admin_id, action, target_type, target_id, timestamp }) {
    this.id = id;
    this.admin_id = admin_id;
    this.action = action;
    this.target_type = target_type;
    this.target_id = target_id;
    this.timestamp = timestamp;
  }
}

module.exports = AdminLog; 