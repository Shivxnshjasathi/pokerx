# 🃏 PokerX - Ultimate Multiplayer Texas Hold'em

PokerX is a premium, high-fidelity real-time multiplayer poker application built with **Next.js**, **Tailwind CSS**, and **Firebase**. It provides a 4K casino-grade experience with professional game mechanics and an aesthetic glassmorphic UI.

![PokerX Landscape](/public/favicon.png)

## ✨ Features

### 💎 Premium Aesthetics
- **Casino-Grade UI**: A "Casino Royale" inspired design featuring emerald felt, gold accents, and glassmorphic panels.
- **Cinematic Showdowns**: Theatrical winner overlays with trophy displays and detailed hand strength rankings.
- **High-Fidelity Cards**: 3D-effect cards with paper textures, 4K suits, and custom "PokerX" back patterns.
- **Fluid Animations**: Smooth transitions for card dealing, pot aggregation, and player turns.

### 🎮 Professional Gameplay
- **Real-Time Multiplayer**: Instant state synchronization via Firebase Firestore with atomic transaction handling.
- **Rotating Dealer Button**: Proper Texas Hold'em dealer rotation (Heads-up aware).
- **Advanced Engine**: Accurate split-pot and side-pot calculations based on standard professional rules.
- **Intelligent Bots**: Smart AI players that use Hand Strength evaluation to make strategic decisions.
- **Turn Management**: Automatic turn timeouts and activity tracking to keep games moving.

### 📱 Mobile First
- **Landscape Optimized**: Tailored for mobile tilting ("Tilt to Play") with adaptive UI geometry.
- **Orientation Guidance**: Built-in guidance for portrait users to switch to the superior landscape view.
- **Touch Precision**: Large, accessible action buttons for seamless mobile gameplay.

## 🚀 Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Backend**: Firebase Firestore & Auth
- **Icons**: Lucide React
- **Engine**: Custom Functional Poker Engine with `pokersolver` integration

## 🛠️ Getting Started

1. **Clone and Install**:
```bash
git clone <repo-url>
cd pokerx
npm install
```

2. **Environment Setup**:
Create a `.env.local` file with your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

3. **Run Dev Server**:
```bash
npm run dev
```

## 📜 Game Rules
PokerX follows standard Texas Hold'em rules:
- **Heads-Up**: Special logic where the Dealer is the Small Blind.
- **Min-Raise**: Minimum raise is equal to the last bet or raise amount.
- **Side Pots**: Automatically calculated when multiple players are all-in with varying stack sizes.

## 🔒 Security
The project includes pre-configured **Firestore Rules** (`firestore.rules`) to protect active tables and ensure data integrity.

---
Built with ❤️ by the PokerX Team
