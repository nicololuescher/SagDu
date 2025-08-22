from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "root"

@app.get('/user')
def user():
    return "user"

@app.post('/user')
def create_user():
    return "create user"

@app.put('/user')
def update_user():
    return "update user"

@app.get('/ingredient')
def ingredient():
    return "ingredient"

@app.post('/ingredient')
def create_ingredient():
    return "create ingredient"

@app.put('/ingredient')
def update_ingredient():
    return "update ingredient"

@app.get('/meal')
def meal():
    return "meal"

@app.post('/meal')
def create_meal():
    return "create meal"

@app.get('/menu')
def menu():
    return "menu"

@app.post('/menu')
def create_menu():
    return "create menu"

@app.put('/menu')
def update_menu():
    return "update menu"

@app.get('/shopping_list')
def shopping_list():
    return "shopping list test"

if __name__ == '__main__':
    app.run(debug=True)
