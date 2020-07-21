from flask import Flask
from flask_restful import Resource, Api

app = Flask(__name__)
api = Api(app)

class MyMain(Resource):
    def get(self):
        return {'message': 'Hello SUSE Container & Application Platform!'}

api.add_resource(MyMain, '/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
