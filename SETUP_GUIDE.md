# BloodSync - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites Check
```powershell
# Check installations
node --version        # Should be v18+
python --version      # Should be 3.9+
mysql --version       # Should be 8.0+
```

---

## 📦 Step 1: Database Setup

```powershell
# Start MySQL
# Login to MySQL
mysql -u root -p

# Run setup scripts
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
mysql -u root -p < database/procedures.sql
mysql -u root -p < database/functions.sql
mysql -u root -p < database/triggers.sql
```

---

## ⚙️ Step 2: Backend Configuration

```powershell
cd backend
```

Create **`backend/.env`**:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=bloodsync
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
NODE_ENV=development
```

Start backend:
```powershell
npm run dev
```

✅ Backend running at: http://localhost:3000

---

## 🤖 Step 3: AI Service Configuration

```powershell
cd ai-service
```

Create **`ai-service/.env`**:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=bloodsync
```

Install dependencies and start:
```powershell
pip install -r requirements.txt
python main.py
```

✅ AI Service running at: http://localhost:8000

---

## 🎨 Step 4: Frontend Setup

```powershell
cd frontend
npm run dev
```

✅ Frontend running at: http://localhost:5173

---

## 🧪 Test Everything

### 1. Test AI Service Health
```powershell
curl http://localhost:8000/
# Expected: {"service": "BloodSync AI", "status": "operational"}
```

### 2. Test Inventory Agent
```powershell
curl http://localhost:8000/api/agents/inventory
```

### 3. Test ML Issuance Agent
```powershell
curl -X POST http://localhost:8000/api/agents/issuance `
  -H "Content-Type: application/json" `
  -d '{"blood_group":"O+","component_type":"Whole Blood","department":"Operating Theatre","urgency":"Routine","units_requested":1}'
```

### 4. Open Frontend
Visit: http://localhost:5173

---

## 🎯 What You Can Do Now

✅ **Working Features:**
- View Dashboard with inventory stats
- Browse inventory
- Chat with AI Copilot
- Get ML-guided issuance recommendations
- View waste reduction analysis
- Check inventory levels

⚠️ **Not Yet Implemented:**
- Complete donor/patient management
- Full request workflow
- All frontend pages
- Background job automation

---

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify `.env` database credentials
- Check port 3000 is not in use

### AI Service errors
- Verify Python dependencies installed
- Check database connection in `.env`
- Ensure MySQL tables exist

### Frontend connection issues
- Check backend is running on port 3000
- Verify CORS is enabled (already configured)
- Check browser console for errors

---

## 📊 Quick Test Queries

### Get Waste Analysis
```powershell
curl http://localhost:8000/api/agents/waste
```

### Chat with AI
```powershell
curl -X POST http://localhost:8000/api/agents/chat `
  -H "Content-Type: application/json" `
  -d '{"message":"What is the current inventory status?"}'
```

### Predict Return Probability
```powershell
curl -X POST http://localhost:8000/api/agents/predict-return `
  -H "Content-Type: application/json" `
  -d '{"blood_group":"AB+","department":"Oncology","urgency":"Routine","units_requested":2}'
```

---

## 🎓 Understanding the ML Algorithm

The ML Issuance Agent implements research from **arXiv:2411.14939**.

**How it works:**
1. Analyzes request features (department, urgency, time, etc.)
2. Predicts probability of blood unit being returned unused
3. If probability > 55%: Recommends **NEWER** unit (not oldest)
4. Reason: Returned newer units have more shelf life remaining
5. Result: ~14% reduction in wastage

**Try it:**
- High return probability: Oncology, Outpatient, Routine requests
- Low return probability: ICU, Emergency, Urgent requests

---

## 📞 Next Steps

See `report.md` for:
- Complete feature list
- Technology stack details
- Architecture diagrams
- Deployment roadmap
- Missing features

---

**Ready to Run? Execute all three services and visit http://localhost:5173**
