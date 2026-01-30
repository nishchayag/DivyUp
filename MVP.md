# DivyUp - Expense Splitting Platform

### MVP Delivery Document | Phase 1 Complete

---

## 📋 Executive Summary

**DivyUp** is a modern, full-stack web application designed to simplify shared expense management among groups. Whether it's roommates splitting rent, friends sharing a vacation, or colleagues managing team lunches — DivyUp eliminates the awkwardness of "who owes whom" with smart, automated calculations.

**Delivered:** January 2026  
**Technology Stack:** Next.js 14, TypeScript, MongoDB, Tailwind CSS  
**Status:** ✅ MVP Complete & Production-Ready

---

## 🎯 Problem Statement

Managing shared expenses is a universal pain point:

- Mental math leads to errors and disputes
- Spreadsheets are tedious and hard to maintain
- Existing solutions are often bloated or expensive
- Settling up requires multiple transactions

**DivyUp solves this** by providing an intuitive platform that tracks expenses, calculates balances in real-time, and minimizes the number of payments needed to settle all debts.

---

## ✅ Delivered Features (MVP)

### 1. User Authentication

| Feature                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| Email/Password Sign-up | Secure account creation with encrypted passwords |
| Email/Password Sign-in | Session-based authentication                     |
| OAuth Ready            | GitHub OAuth integration (configurable)          |
| Protected Routes       | Automatic redirect for unauthenticated users     |

### 2. Group Management

| Feature        | Description                            |
| -------------- | -------------------------------------- |
| Create Groups  | Name, description, and initial members |
| Invite Members | Add users by email address             |
| Leave Groups   | Members can remove themselves          |
| Remove Members | Group creator can remove others        |
| Delete Groups  | Creator-only group deletion            |

### 3. Expense Tracking

| Feature         | Description                                |
| --------------- | ------------------------------------------ |
| Add Expenses    | Title, amount, who paid                    |
| Equal Split     | Automatic division among all group members |
| View History    | Chronological expense list per group       |
| Delete Expenses | Remove incorrect entries                   |

### 4. Smart Balance Calculation

| Feature                | Description                          |
| ---------------------- | ------------------------------------ |
| Real-time Balances     | See who owes what instantly          |
| Net Calculation        | Combines all transactions per person |
| Optimized Settlements  | Minimizes number of payments needed  |
| Settlement Suggestions | Clear "X pays Y $Z" instructions     |

### 5. User Experience

| Feature             | Description                         |
| ------------------- | ----------------------------------- |
| Landing Page        | Marketing page for new visitors     |
| Responsive Design   | Works on mobile, tablet, desktop    |
| Dark Mode           | System-aware + manual toggle        |
| Loading States      | Skeleton loaders for smooth UX      |
| Empty States        | Helpful prompts when no data        |
| Toast Notifications | Success/error feedback              |
| Form Validation     | Real-time input validation with Zod |

---

## 🏗️ Technical Architecture

### Frontend

```
Next.js 14 (App Router)
├── Server Components (performance)
├── Client Components (interactivity)
├── TypeScript (type safety)
└── Tailwind CSS (styling)
```

### Backend

```
Next.js API Routes
├── RESTful endpoints
├── Server-side authentication
├── Input validation (Zod)
└── Error handling
```

### Database

```
MongoDB + Mongoose ODM
├── User collection (auth, profile)
├── Group collection (members, creator)
└── Expense collection (amounts, splits)
```

### Authentication

```
NextAuth.js
├── JWT sessions
├── Credentials provider
├── OAuth support (GitHub)
└── Protected middleware
```

---

## 📊 API Endpoints Delivered

| Method | Endpoint                   | Purpose                  |
| ------ | -------------------------- | ------------------------ |
| POST   | `/api/auth/signup`         | User registration        |
| POST   | `/api/auth/signin`         | User login               |
| GET    | `/api/groups`              | List user's groups       |
| POST   | `/api/groups`              | Create new group         |
| GET    | `/api/groups/[id]`         | Group details + expenses |
| PATCH  | `/api/groups/[id]`         | Update group             |
| DELETE | `/api/groups/[id]`         | Delete group             |
| POST   | `/api/groups/[id]/members` | Invite member            |
| DELETE | `/api/groups/[id]/members` | Leave/remove member      |
| POST   | `/api/expenses`            | Create expense           |
| GET    | `/api/expenses/[id]`       | Get expense              |
| PATCH  | `/api/expenses/[id]`       | Update expense           |
| DELETE | `/api/expenses/[id]`       | Delete expense           |

---

## 🖥️ Screenshots

### Landing Page

- Hero section with value proposition
- Feature highlights (3 cards)
- How it works (4 steps)
- Call-to-action buttons

### Dashboard

- Group cards with member count
- Quick "New Group" action
- Empty state for new users

### Group Detail

- Member list with roles
- Expense history
- Balance summary
- Settlement suggestions
- Add expense modal

---

## 🔒 Security Features

- ✅ Password hashing (bcrypt)
- ✅ JWT-based sessions
- ✅ CSRF protection (NextAuth)
- ✅ Input validation & sanitization
- ✅ Protected API routes
- ✅ Environment variable secrets

---

## 📈 Performance

- Server-side rendering for fast initial load
- Optimized database queries with Mongoose
- Efficient client-side state management
- Lazy loading of components
- Skeleton loaders for perceived performance

---

## 🚀 Deployment Ready

The application is configured for easy deployment:

- **Vercel**: Zero-config deployment
- **MongoDB Atlas**: Cloud database
- **Environment Variables**: Documented in `.env.example`

---

## 📁 Project Structure

```
DivyUp/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── groups/            # Group pages
│   └── page.tsx           # Landing/Dashboard
├── components/            # React components
├── lib/                   # Utilities & config
├── models/                # Mongoose schemas
├── utils/                 # Helper functions
└── types/                 # TypeScript definitions
```

---

## 💰 Business Value

### For End Users

- **Save Time**: No more manual calculations
- **Reduce Conflicts**: Clear, transparent records
- **Easy Settling**: Minimized transactions

### For Business

- **Scalable**: Cloud-native architecture
- **Maintainable**: Clean, documented code
- **Extensible**: Ready for Phase 2 features

---

## 🔮 Phase 2 Roadmap (Upcoming)

The following features are planned for the next development phase:

1. **Expense Categories** - Tags with icons for better organization
2. **User Avatars** - Profile pictures for personalization
3. **Settlement Tracking** - Mark debts as paid
4. **Date Picker** - Custom expense dates
5. **Spending Charts** - Visual analytics
6. **Receipt Upload** - Attach proof of purchase
7. **Email Notifications** - Stay informed
8. **Multiple Currencies** - International support

---

## 📞 Support & Maintenance

This MVP includes:

- Full source code ownership
- Documentation (README, API docs)
- Environment setup guide
- 30-day bug fix warranty

---

**Thank you for choosing DivyUp.**  
_Splitting expenses, not friendships._

---

_Document Version: 1.0_  
_Last Updated: January 2026_
