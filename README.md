
# 🛡️ SafeNexa AI

### AI-Powered Safety Intelligence & Serious Incident Prevention Platform

SafeNexa AI is an intelligent safety analytics platform designed to help organizations analyze safety reports, identify potential risks, detect recurring patterns, and support the prevention of Serious Injuries and Fatalities (SIFs).

The platform combines **Artificial Intelligence, Natural Language Processing, Safety Intelligence, and Data Analytics** to transform safety-related information into actionable insights.

---

# 🎯 Problem Statement

Organizations collect large amounts of safety-related information through:

- Incident reports
- Near-miss reports
- Hazard observations
- Safety feedback
- Workplace safety reports

However, manually analyzing this information can be time-consuming and may make it difficult to identify hidden patterns and high-risk situations early.

SafeNexa AI addresses this challenge by providing an intelligent platform that analyzes safety information and helps users identify potential risks, recurring patterns, and important safety trends.

---

# 💡 Our Solution

SafeNexa AI provides a centralized AI-powered safety intelligence platform where users can:

- 📄 Upload and analyze safety reports
- 🤖 Perform AI-powered safety analysis
- ⚠️ Identify potential safety risks
- 🔍 Detect recurring incident patterns
- 🛡️ Analyze Serious Injury and Fatality (SIF) potential
- 📊 View safety analytics and trends
- 💡 Receive intelligent safety insights and recommendations
- 🚨 Monitor important safety alerts
- 💬 Provide safety feedback

The goal is to support **proactive safety management** rather than relying only on reactive incident analysis.

---

# ✨ Key Features

## 🤖 AI Safety Analyzer

Analyzes safety reports using Natural Language Processing techniques to identify important safety-related information and potential risks.

## ⚠️ Risk Intelligence

Helps identify potential hazards and evaluate the severity of safety situations.

## 📊 Safety Analytics Dashboard

Provides visual insights into safety data, trends, patterns, and risk indicators.

## 🔍 Pattern Detection

Identifies recurring safety issues and patterns across multiple reports.

## 🚨 Safety Alerts

Supports the identification and management of important safety alerts.

## 📄 Report Management

Allows users to upload, analyze, and manage safety-related reports.

## 🧠 HSE Intelligence

Provides intelligent insights to support Health, Safety, and Environment decision-making.

## 💬 Safety Feedback

Allows users to provide feedback and contribute safety-related observations.

## 🔐 User Authentication

Includes user registration, login, logout, password recovery, and session management.

## 🌙 Modern User Interface

Provides a professional interface with dashboards, visual analytics, responsive components, and theme support.

---

# 🏗️ System Architecture

```text
                        ┌─────────────────────┐
                        │       USER          │
                        │ Safety Professional │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │    SafeNexa AI UI   │
                        │   Next.js Frontend  │
                        └──────────┬──────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │        API LAYER         │
                    │    Next.js API Routes    │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │ Report Analysis │ │ Safety Engine  │ │ Authentication │
     │     Module      │ │ & Intelligence │ │     Module     │
     └────────┬───────┘ └────────┬───────┘ └────────────────┘
              │                  │
              ▼                  ▼
     ┌────────────────┐ ┌────────────────────┐
     │ NLP Processing │ │ Pattern & Risk     │
     │     Engine     │ │ Detection Engine   │
     └────────┬───────┘ └─────────┬──────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Safety Insights │
                              │ Alerts & Reports│
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Database / Data │
                              │     Storage     │
                              └─────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend

- Next.js API Routes
- Python

## Artificial Intelligence

- Natural Language Processing
- Safety Text Analysis
- Pattern Detection
- Risk Intelligence

## Database

- Prisma
- JSON-based data storage

## Automation

- n8n Workflow Automation

---

# 📂 Project Structure

```text
SafeNexa-AI/
│
├── backend/
│   ├── main.py
│   ├── nlp_engine.py
│   └── requirements.txt
│
├── data/
│   ├── database.json
│   └── users.json
│
├── docs/
│   └── n8n_pipeline.json
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── app/
│   │   ├── analyzer/
│   │   ├── alerts/
│   │   ├── reports/
│   │   ├── patterns/
│   │   ├── feedback/
│   │   ├── settings/
│   │   └── api/
│   │
│   ├── components/
│   │   ├── charts/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── upload/
│   │
│   └── lib/
│       ├── auth/
│       ├── data/
│       ├── db/
│       ├── extractor/
│       ├── nlp/
│       └── rules/
│
├── package.json
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/shakthi-stack-sketch/SafeNexa-AI.git
```

## 2️⃣ Navigate to the Project

```bash
cd SafeNexa-AI
```

## 3️⃣ Install Frontend Dependencies

```bash
npm install
```

## 4️⃣ Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## 5️⃣ Configure Environment Variables

Create a `.env` file in the project root and configure the required environment variables.

Example:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
```

⚠️ **Never upload your actual `.env` file to GitHub.**

---

# 🚀 Running the Application

Start the Next.js application:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# 📊 Core Workflow

```text
Safety Report
      │
      ▼
Upload & Data Collection
      │
      ▼
Text Extraction
      │
      ▼
AI / NLP Processing
      │
      ▼
Risk & Pattern Analysis
      │
      ▼
SIF Potential Identification
      │
      ▼
Safety Intelligence
      │
      ▼
Alerts, Insights & Recommendations
```

---

# 🔮 Future Enhancements

- Advanced Machine Learning models
- Real-time safety monitoring
- Predictive risk analytics
- IoT sensor integration
- Computer vision for workplace safety
- Voice-based safety reporting
- Advanced AI agents for safety intelligence
- Mobile application support
- Enterprise-level analytics

---

# 🎓 Project Purpose

SafeNexa AI was developed as an innovative project focused on applying **Artificial Intelligence and modern web technologies to workplace safety intelligence and serious incident prevention**.

The platform demonstrates how AI can support organizations in transforming safety data into meaningful insights and proactive actions.

---

# 🛡️ SafeNexa AI

### **From Safety Data to Intelligent Prevention.**

🚀 *Building safer workplaces through Artificial Intelligence.*