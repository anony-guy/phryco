# Phryco 

**The Ethical, Decentralized Video Streaming Platform**

Phryco is a modern, high-performance video streaming platform built with Python, FastAPI, and Vanilla JS. It is designed to be highly scalable, privacy-respecting, and ethically aligned, featuring a unique "Halal Mode" for content filtering and a decentralized global relay network.

## 🚀 Key Features

- **Video Streaming & Processing**: Automated FFmpeg compression and adaptive bitrate streaming. Background processing powered by Celery & Redis.
- **Halal Mode**: A specialized content moderation toggle that automatically filters out content flagged as Sharia non-compliant, containing unauthorized music, or taswir, ensuring a safe viewing environment.
- **Phryco Network (Relay Nodes)**: A decentralized edge-delivery system. Anyone can download the Relay Software and host a sub-node to distribute Phryco video content globally, improving latency and reducing server load.
- **Phryco SSO & Developer Portal**: A built-in OAuth 2.0 provider. Developers can register third-party applications and let their users "Sign in with Phryco", complete with secure token exchange and profile access.
- **Phrybucks & Creator Economy**: An integrated virtual currency (`Phrybucks`) that powers channel memberships, donations, and ad campaigns.
- **Enterprise Scalability**: Redis-backed rate limiting and background task queues ensure the platform remains lightning fast under heavy load.

## 🛠 Tech Stack

- **Backend**: FastAPI, SQLAlchemy, Celery, Redis, SQLite/Supabase PostgreSQL
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, custom CSS
- **Infrastructure**: FFmpeg, Uvicorn, Celery Beat

## 📖 Quick Start

1. **Clone & Setup Environment**
   ```bash
   git clone https://github.com/phryco/phryco.git
   cd phryco/backend
   python -m venv venv
   source venv/Scripts/activate
   pip install -r requirements.txt
   ```

2. **Start the Infrastructure**
   Start your local Redis server on port `6379`.

3. **Run the Backend**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. **Run the Celery Worker**
   ```bash
   celery -A worker.celery_app worker --loglevel=info --concurrency=2
   ```

## ⚖️ License

Phryco is released under a **Special Ethical License**. Please see the [LICENSE.md](LICENSE.md) file for critical usage restrictions regarding content compliance.
