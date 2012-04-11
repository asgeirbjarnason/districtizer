#!/usr/bin/env python
# -*- coding: utf-8 -*-

import flask

app = flask.Flask(__name__)
app.debug = True

@app.route('/', methods=['GET'])
def sitemap():
  response = flask.make_response(open('rootdir/index.html').read())
  response.headers["Content-type"] = "text/html"
  return response

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port', dest='port', type=int, default=80)
    args = parser.parse_args()
    app.run(port=args.port)
