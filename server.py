from flask import Flask, send_from_directory, request, jsonify
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('site', 'mm.html')

@app.route('/mm.html')
def mm_html():
    return send_from_directory('site', 'mm.html')

@app.route('/mm.js')
def mm_js():
    return send_from_directory('site', 'mm.js')

@app.route('/mm.css')
def mm_css():
    return send_from_directory('site', 'mm.css')

@app.route('/proofs/<path:filename>')
def proofs(filename):
    return send_from_directory('proofs', filename)

@app.route('/categories')
def categories():
    files = sorted([f[:-4] for f in os.listdir('proofs') if f.endswith('.mm1')])
    return jsonify(files)

@app.route('/add-theorem', methods=['POST'])
def add_theorem():
    data = request.json
    category = data['category']
    code = data['code']
    filepath = f'proofs/{category}.mm1'
    with open(filepath, 'a') as f:
        f.write('\n' + code + '\n')
    return jsonify({'status': 'ok'})

@app.route('/add-category', methods=['POST'])
def add_category():
    data = request.json
    name = data['name']
    code = data['code']
    filepath = f'proofs/{name}.mm1'
    with open(filepath, 'w') as f:
        f.write(code)
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=8000)