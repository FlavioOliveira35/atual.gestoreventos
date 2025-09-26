from . import db

class NotificationSetting(db.Model):
    __tablename__ = 'notification_setting'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), nullable=False, unique=True)
    value = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return f'<NotificationSetting {self.key}>'
