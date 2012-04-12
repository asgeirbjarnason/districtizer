#!/usr/bin/env python
# -*- coding: utf-8 -*-

import flask
import json

app = flask.Flask(__name__)
app.debug = True

@app.route('/', methods=['GET'])
def sitemap():
  response = flask.make_response(open('rootdir/index.html').read())
  response.headers["Content-type"] = "text/html"
  return response

@app.route('/polygons', methods=['GET', 'PUT'])
def polygons():
    polygonpath = './data/polygons.json'
    if flask.request.method == 'PUT':
        polygonfile = open(polygonpath, 'w')
        polygonfile.write(json.dumps(flask.request.json))
        return ''
    else:
        response = flask.make_response(open(polygonpath).read())
        response.headers["Content-type"] = 'application/json'
        return response

@app.route('/locations', methods=['GET'])
def locations():
    response = flask.make_response(open('./data/locations.json').read())
    response.headers['Content-type'] = 'application/json'
    return response

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port', dest='port', type=int, default=80)
    args = parser.parse_args()
    app.run(port=args.port)
