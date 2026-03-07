# MuleGuard Web Deployment Guide

Because MuleGuard separates its React frontend and FastAPI backend, we will deploy them to two specialized platforms for optimal performance (and to stay within free tiers)!

- **Backend**: Render (Excellent for Python Web Services)
- **Frontend**: Vercel (The best platform for React apps)

## Step 1: Push Your Code to GitHub
Both Vercel and Render deploy automatically from your GitHub repository.
1. Go to [GitHub](https://github.com/) and create a new repository (e.g., `muleguard-ai`).
2. Open your terminal in the `d:\code\PW-RIFT\MG` folder.
3. Run the following commands:
```bash
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/muleguard-ai.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` and the repo name with your actual URL).*

---

## Step 2: Deploy the Backend (FastAPI) to Render
We will deploy the backend first so we can get its live URL, which the frontend needs.

1. Go to [Render](https://render.com/) and sign up/log in with GitHub.
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub account and select your `muleguard-ai` repository.
4. Render will automatically detect the [render.yaml](file:///d:/code/PW-RIFT/MG/render.yaml) file we just created.
5. Click **Apply Blueprint**.
6. Render will begin building and deploying your FastAPI backend.
7. Once deployed, note down your backend URL (it will look like `https://muleguard-backend-xxxx.onrender.com`).

*(Note: The first time you deploy, the free tier on Render takes ~2 minutes to spin up from sleep).*

---

## Step 3: Deploy the Frontend (React) to Vercel
Now we connect the frontend to the live backend.

1. Go to [Vercel](https://vercel.com/) and sign up/log in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your `muleguard-ai` repository.
4. **Important Framework Settings**:
   - Vercel should auto-detect "Create React App".
   - **Root Directory**: Click "Edit" and change this to `frontend`.
5. **Environment Variables**:
   - Add a new environment variable.
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://muleguard-backend-xxxx.onrender.com` *(Paste the exact URL from Step 2, **without** a trailing slash `/`)*.
6. Click **Deploy**. Vercel will build the React app.
7. Once finished, Vercel will give you your live URL (e.g., `https://muleguard-ai.vercel.app`).

---

## Step 4: Final Backend Security Update (CORS)
To make sure your backend accepts connections from your new Vercel URL, update the origin policy on Render:

1. Go back to the **Render Dashboard**.
2. Select your `muleguard-backend` service.
3. Go to the **Environment** tab.
4. Update the `FRONTEND_ORIGINS` variable value to your exact Vercel URL (e.g., `https://muleguard-ai.vercel.app`).
5. Save changes (Render will automatically redeploy the backend with the new setting).

**Congratulations! Your MuleGuard application is now live on the internet!**
