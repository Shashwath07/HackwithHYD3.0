import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from dotenv import load_dotenv

load_dotenv(os.path.join(ROOT, ".env"))

import logging

from flask import Flask, send_from_directory

from backend.routes.chat import chat_bp

logging.basicConfig(level=logging.INFO)


def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(ROOT, "frontend"),
        static_url_path="",
    )
    app.register_blueprint(chat_bp, url_prefix="/api")

    @app.get("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG") == "1",
    )
