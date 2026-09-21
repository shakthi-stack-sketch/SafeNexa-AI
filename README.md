# 🛡️ SafeNexa AI

### AI-Powered Safety Intelligence & Serious Incident Prevention Platform

SafeNexa AI is an intelligent safety platform designed to help organizations analyze safety reports, identify potential risks, detect recurring patterns, and support proactive safety decision-making.

By combining **Artificial Intelligence, Natural Language Processing, Safety Intelligence, and Data Analytics**, SafeNexa AI transforms safety-related information into meaningful and actionable insights.

---

## 🎯 Problem Statement

Organizations generate large amounts of safety-related information through:

- Incident reports
- Near-miss reports
- Hazard observations
- Workplace safety reports
- Safety feedback

Manually analyzing this information can be time-consuming and challenging. Important patterns and high-risk situations may be difficult to identify early.

SafeNexa AI addresses this challenge by providing an intelligent platform that helps analyze safety information, identify potential risks, detect recurring patterns, and support proactive safety management.

---

## 💡 Our Solution

SafeNexa AI provides a centralized AI-powered safety intelligence platform where users can:

- 📄 Upload and analyze safety reports
- 🤖 Perform AI-powered safety analysis
- ⚠️ Identify potential safety risks
- 🔍 Detect recurring safety patterns
- 🛡️ Analyze Serious Injury and Fatality (SIF) potential
- 📊 View safety trends and analytics
- 💡 Receive intelligent insights and recommendations
- 🚨 Monitor safety alerts
- 💬 Provide safety feedback

The platform focuses on supporting a **proactive approach to workplace safety** by transforming safety data into useful intelligence.

---

## ✨ Key Features

### 🤖 AI Safety Analyzer

Analyzes safety reports and extracts important safety-related information using Natural Language Processing techniques.

### ⚠️ Risk Intelligence

Helps identify potential hazards and understand the severity of safety-related situations.

### 📊 Safety Analytics

Provides visual insights into safety trends, patterns, and risk indicators.

### 🔍 Pattern Detection

Identifies recurring issues and patterns across multiple safety reports.

### 🚨 Safety Alerts

Supports the identification and management of important safety alerts.

### 📄 Report Management

Allows users to upload, analyze, and manage safety-related reports.

### 🧠 HSE Intelligence

Provides intelligent insights to support Health, Safety, and Environment decision-making.

### 💬 Safety Feedback

Allows users to provide feedback and contribute safety-related observations.

### 🔐 User Authentication

Includes user registration, login, logout, password recovery, and user session management.

### 🎨 Modern User Interface

Provides a professional and responsive interface with dashboards, analytics, and modern UI components.

---

# 🏗️ System Architecture

```text
                    ┌───────────────────────┐
                    │         USER          │
                    │  Safety Professional  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │      SafeNexa AI      │
                    │   Next.js Frontend    │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │       API Layer       │
                    │  Next.js API Routes   │
                    └───────────┬───────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
    ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
    │ Report Analysis│ │ Safety & Risk  │ │ Authentication │
    │     Module     │ │ Intelligence   │ │     Module     │
    └───────┬────────┘ └───────┬────────┘ └────────────────┘
            │                  │
            ▼                  ▼
    ┌────────────────┐ ┌────────────────────┐
    │ NLP Processing │ │ Pattern & Risk     │
    │     Engine     │ │ Detection Engine   │
    └───────┬────────┘ └─────────┬──────────┘
            │                    │
            └──────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Safety Insights  │
              │ Alerts & Reports │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  Data Storage    │
              │ Prisma / JSON DB │
              └──────────────────┘🛠️ Technology Stack
Frontend

Next.js
React
TypeScript
Tailwind CSS

Backend

Next.js API Routes
Python
Artificial Intelligence
Natural Language Processing
Safety Text Analysis
Pattern Detection
Risk Intelligence

Database

Prisma
JSON-based data storage

Automation

n8n Workflow Automation

📂 Project Structure
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
│   │   ├── hse-intelligence/
│   │   ├── settings/
│   │   └── api/
│   │
│   ├── components/
│   │   ├── charts/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── upload/
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── data/
│   │   ├── db/
│   │   ├── extractor/
│   │   ├── nlp/
│   │   ├── rules/
│   │   └── store/
│   │
│   └── middleware.ts
│
├── package.json
├── .gitignore
├── .env.example
└── README.md

⚙️ Installation

1. Clone the Repository
git clone https://github.com/shakthi-stack-sketch/SafeNexa-AI.git
2. Navigate to the Project Folder
cd SafeNexa-AI
3. Install Frontend Dependencies
npm install
4. Install Python Dependencies
cd backend
pip install -r requirements.txt
🔐 Environment Configuration

Create a .env file in the project root and configure the required environment variables.

Example:

DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key

⚠️ Never upload your actual .env file containing secrets or credentials to GitHub.

🚀 Running the Application

Start the Next.js development server:

npm run dev

Then open the application in your browser:

http://localhost:3000
📊 Core Workflow
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

🔮 Future Enhancements

Advanced Machine Learning models
Real-time safety monitoring
Predictive risk analytics
IoT sensor integration
Computer vision for workplace safety
Voice-based safety reporting
Advanced AI agents for safety intelligence
Mobile application support
Enterprise-level analytics

🎓 Project Purpose

SafeNexa AI was developed as an innovative project focused on applying Artificial Intelligence and modern web technologies to workplace safety intelligence and serious incident prevention.

The platform demonstrates how AI can help transform safety data into meaningful insights and support proactive safety decision-making.

🛡️ SafeNexa AI
From Safety Data to Intelligent Prevention.

🚀 Building safer workplaces through Artificial Intelligence. 