# Docker Commands Guide

Here is a quick list of the most important Docker commands you'll need to run and manage your project locally:

## 🚀 Starting and Stopping the Project

- **Start everything in the background:**
  ```bash
  docker compose up -d
  ```
  *(This turns on both the frontend and backend servers. The `-d` flag runs them in the background so your terminal remains free).*

- **Stop everything:**
  ```bash
  docker compose down
  ```
  *(This stops and removes the running containers but keeps your data intact).*

- **Rebuild and Start (Use this if you change your code!):**
  ```bash
  docker compose up -d --build
  ```
  *(If you edit any Python files, React files, or `requirements.txt`/`package.json`, run this so Docker builds the fresh code).*

## 🔍 Monitoring & Debugging

- **View logs for all services:**
  ```bash
  docker compose logs -f
  ```
  *(This shows you a live stream of what both the backend and frontend are doing—very useful if something crashes).*

- **View logs for a specific service:**
  ```bash
  docker compose logs -f backend
  ```
  *OR*
  ```bash
  docker compose logs -f frontend
  ```

- **Check what containers are currently running:**
  ```bash
  docker compose ps
  ```

## 🧹 Cleaning Up

- **Stop containers and erase all docker volumes/data:**
  ```bash
  docker compose down -v
  ```
  *(Use this if you want to completely wipe the database or reset everything to zero).*

---
**To test the project:**
Run `docker compose up -d`, open your web browser, and navigate directly to:
👉 **[http://localhost:3000](http://localhost:3000)**
