# 📋 Collaborative ToDo App - Team Task Management Application

A modern collaborative task management application built with Next.js and Supabase, enabling teams to efficiently organize around shared projects.

## ✨ Features

### 🔐 Authentication
- **Email/Password login** with full validation
- **Google OAuth authentication** for quick sign-in
- **User profile management** with avatar and personal information
- **Secure password change**
- **Account deletion** with confirmation

### 📊 Project Management
- **Create projects** with title and description
- **Dashboard** with project overview
- **Real-time progress statistics**
- **Edit and delete** projects
- **Sort by creation date** (oldest first)

### ✅ Task Management
- **Create tasks** with title and optional description
- **Mark complete/incomplete** with optimistic updates
- **Edit and delete** tasks
- **Progress tracking** per project
- **Intuitive interface** with checkboxes

### 👥 Team Collaboration
- **Invite members** by email address
- **Hierarchical role system**:
  - **Owner**: Full control of the project
  - **Admin**: Manage members and content
  - **Editor**: Modify tasks and content
  - **Viewer**: Read-only access
- **Role-based permissions management**
- **Remove members** (except the owner)

### 🎨 User Interface
- **Light/Dark theme** with instant switching
- **Responsive design** for all screen sizes
- **Toast notifications** for user actions
- **Custom confirmation dialogs**
- **Loading states** and smooth animations
- **Consistent Lucide React icons**

### 🔒 Security & Permissions
- **Role-based access control (RBAC)**
- **Client-side and server-side validation**
- **Row-Level Security (RLS) policies** in the database
- **Error handling** with clear messages
- **Protection against unauthorized actions**

## 🛠️ Technologies Used

### Frontend
- **[Next.js 14](https://nextjs.org/)** – React framework with App Router
- **[React 18](https://react.dev/)** – UI library
- **[TypeScript](https://www.typescriptlang.org/)** – Static typing for JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** – Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** – Accessible UI components
- **[Lucide React](https://lucide.dev/)** – Modern SVG icons
- **[next-themes](https://github.com/pacocoursey/next-themes)** – Theme management

### Backend & Database
- **[Supabase](https://supabase.com/)** – Backend-as-a-Service
  - PostgreSQL database
  - Built-in authentication
  - Row-Level Security (RLS) policies
  - Automatic REST API

## 🔗 Link : [Collaborative-ToDo-App](v0-collaborative-todo-app-flame.vercel.app)

**Developed using Next.js and Supabase**
