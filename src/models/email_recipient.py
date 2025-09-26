from . import db

class EmailRecipient(db.Model):
    __tablename__ = 'email_recipient'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    city_id = db.Column(db.Integer, db.ForeignKey('city.id'), nullable=False)

    city = db.relationship('City', backref=db.backref('email_recipients', lazy=True, cascade="all, delete-orphan"))

    def __repr__(self):
        return f'<EmailRecipient {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'city_id': self.city_id,
            'city_name': self.city.name if self.city else None
        }
