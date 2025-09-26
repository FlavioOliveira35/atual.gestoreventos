from . import db

class ARD(db.Model):
    __tablename__ = 'ard'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)

    city_id = db.Column(db.Integer, db.ForeignKey('city.id'), nullable=False)
    city = db.relationship('City', backref=db.backref('ards', lazy='subquery'))

    def __repr__(self):
        return f'<ARD {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'city_id': self.city_id,
            'city_name': self.city.name if self.city else None
        }
