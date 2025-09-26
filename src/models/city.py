from . import db

class City(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    def __repr__(self):
        return f'<City {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }
