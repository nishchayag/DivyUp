# DivyUp - Expense Splitting App

A modern, full-stack expense splitting application built with Next.js 14, TypeScript, Tailwind CSS, and MongoDB.

## Features

### Core Features

- 🔐 **User Authentication**: Email/password sign-up and sign-in with NextAuth.js
- 🐙 **OAuth Support**: GitHub OAuth integration (configurable)
- 👥 **Groups**: Create and manage expense groups
- 💰 **Expenses**: Add expenses with automatic equal splitting
- 📊 **Balance Calculation**: Real-time balance tracking for each group member
- 💸 **Smart Settlements**: Optimized debt settlement suggestions

### Enhanced Features

- 🌙 **Dark Mode**: System-aware theme with manual toggle
- 📱 **Responsive Design**: Works great on mobile and desktop
- 🔔 **Toast Notifications**: User-friendly feedback for all actions
- ⏳ **Loading States**: Skeleton loaders for better UX
- 🎨 **Empty States**: Helpful prompts when there's no data
- � **Protected Routes**: Middleware-based authentication
- ✅ **Form Validation**: Zod schemas for type-safe validation
- 👥 **Member Management**: Invite/remove members from groups

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root directory (see `.env.example`):

```env
# MongoDB connection string
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/divyup

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth (optional)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
DivyUp/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   └── signup/route.ts          # User registration
│   │   ├── groups/
│   │   │   ├── route.ts                 # List/create groups
│   │   │   └── [id]/
│   │   │       ├── route.ts             # Group CRUD
│   │   │       └── members/route.ts     # Member management
│   │   └── expenses/
│   │       ├── route.ts                 # Create expenses
│   │       └── [id]/route.ts            # Expense CRUD
│   ├── auth/
│   │   ├── signin/page.tsx              # Sign in page
│   │   └── signup/page.tsx              # Sign up page
│   ├── groups/
│   │   ├── new/page.tsx                 # Create group page
│   │   └── [id]/page.tsx                # Group detail page
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Dashboard
├── components/
│   ├── AddExpenseModal.tsx              # Add expense dialog
│   ├── EmptyState.tsx                   # Empty state components
│   ├── ExpenseList.tsx                  # Expense list component
│   ├── GroupCard.tsx                    # Group card component
│   ├── Navbar.tsx                       # Navigation bar
│   ├── Providers.tsx                    # Context providers wrapper
│   ├── Skeleton.tsx                     # Loading skeletons
│   ├── ThemeProvider.tsx                # Dark mode provider
│   └── Toast.tsx                        # Toast notification system
├── lib/
│   ├── auth.ts                          # Auth helper functions
│   ├── mongoose.ts                      # Database connection
│   └── validations.ts                   # Zod schemas
├── models/
│   ├── Expense.ts                       # Expense model
│   ├── Group.ts                         # Group model
│   └── User.ts                          # User model
├── utils/
│   └── calcBalances.ts                  # Balance calculation utilities
├── types/
│   └── next-auth.d.ts                   # NextAuth type extensions
└── middleware.ts                        # Route protection middleware
```

## API Endpoints

### Authentication

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| POST   | `/api/auth/signup`  | Register new user   |
| POST   | `/api/auth/signin`  | Sign in (NextAuth)  |
| GET    | `/api/auth/session` | Get current session |

### Groups

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| GET    | `/api/groups`      | List user's groups |
| POST   | `/api/groups`      | Create new group   |
| GET    | `/api/groups/[id]` | Get group details  |
| PATCH  | `/api/groups/[id]` | Update group       |
| DELETE | `/api/groups/[id]` | Delete group       |

### Members

| Method | Endpoint                   | Description         |
| ------ | -------------------------- | ------------------- |
| POST   | `/api/groups/[id]/members` | Invite member       |
| DELETE | `/api/groups/[id]/members` | Leave/remove member |

### Expenses

| Method | Endpoint             | Description    |
| ------ | -------------------- | -------------- |
| POST   | `/api/expenses`      | Create expense |
| GET    | `/api/expenses/[id]` | Get expense    |
| PATCH  | `/api/expenses/[id]` | Update expense |
| DELETE | `/api/expenses/[id]` | Delete expense |

## Balance Calculation

The app uses a greedy algorithm to calculate optimal settlements:

1. Calculate net balance for each member (positive = owed, negative = owes)
2. Match creditors with debtors to minimize number of transactions
3. Display clear "X pays Y $Z" settlement suggestions

## Notes

- All lint errors resolve after running `npm install`
- No payment gateway integration (per requirements)
- Equal split only (custom splits can be added later)

## License

MIT
# DivyUp
