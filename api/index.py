import os
import sys

# Add parent directory to path so app.py imports cleanly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel entrypoint looks for `app` WSGI callable
if __name__ == "__main__":
    app.run(debug=True)
