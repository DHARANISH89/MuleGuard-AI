# MuleGuard AI
MuleGuard AI is a Financial Forensics Engine built to detect money laundering and money mule accounts using advanced graph-based algorithms. 
The application is split into a robust **FastAPI backend** that processes transaction data into graphs and applies anomaly detection, and a sleek **React frontend** that visualizes the network topology and flags suspicious rings.
![MuleGuard Concept](https://img.shields.io/badge/Status-Active-brightgreen)
![Python Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![React Frontend](https://img.shields.io/badge/Frontend-React-61dafb)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=flat&logo=vercel)](https://mule-guard-ai-7j47.vercel.app/)

## 🌐 Live Demo

> **[https://mule-guard-ai-7j47.vercel.app/](https://mule-guard-ai-7j47.vercel.app/)**

## 📁 Project Structure
This repository contains two main sub-projects:
- `frontend/`: The React-based dashboard UI and graph visualization (using D3.js).
- `backend/`: The FastAPI backend with NetworkX, Pandas, Scikit-learn for graph logic.

## 🚀 Quick Start (Local Development)
The easiest way to run the entire stack locally is using **Docker Compose**.

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/) installed on your machine.

### Running the App
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/DHARANISH89/MuleGuard.git
   cd MuleGuard
   ```
2. Spin up both the frontend and backend using Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Access the application:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)

## ☁️ Deployment
MuleGuard is modular and designed to be deployed across specialized cloud platforms for cost efficiency and performance.

### 1. Deploy the Backend (FastAPI) to Render
The recommended platform for the backend is [Render](https://render.com/).
- Connect your GitHub repository to Render.
- Create a new **Blueprint** instance. Render will automatically detect the `render.yaml` configuration file and deploy your FastAPI application.
- Note your new backend URL (e.g., `https://muleguard-backend.onrender.com`).

### 2. Deploy the Frontend (React) to Vercel
The recommended platform for the frontend is [Vercel](https://vercel.com/).
- Connect your GitHub repository to Vercel and import the project.
- Edit the **Root Directory** setting to explicitly point to the `frontend/` folder.
- Add an Environment Variable:
  - `REACT_APP_API_URL` = `https://muleguard-backend.onrender.com` (Your Render deployment URL from Step 1).
- Deploy!

*(Note: Don't forget to update the `FRONTEND_ORIGINS` environment variable generated on your Render dashboard to explicitly whitelist your new Vercel App URL).*

## 🧠 Core Features
- **Graph Topology Visualization**: See the flow of funds represented as nodes and edges.
- **Pattern Matching Algorithms**: Built-in detection for cycle/ring networks, smurfing, and high-velocity shell chains.
- **Dynamic Risk Scoring**: Flagging system for anomalous nodes using network centrality and PageRank scoring.

## 📝 License
This project is open-source and available under the MIT License.
