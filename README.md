# Smart Todo — Techelix Task Submission

## Overview
This project is a modern, eye-catching **Smart Todo** web application built for **Techelix** as a task submission.  
It provides a clean, smooth, dark glassmorphism UI with **Personal** and **Professional** task management, and stores everything securely in **LocalStorage** so the data stays even after refresh.

---

## Company / Client
**Techelix**

## Project Name
**Smart Todo (Personal + Professional)**

---

## Tech Stack
- **HTML5**
- **CSS3** (Glassmorphism + gradient blobs UI)
- **Bootstrap 5** (layout, tabs, forms, utilities)
- **Bootstrap Icons**
- **Vanilla JavaScript**
- **LocalStorage** for persistence

---

## Core Requirements (Given by Techelix)
✅ **Two categories (tabs):**  
- Personal Tasks  
- Professional Tasks  

✅ **Add task functionality**  
- Task text input  
- Optional due date  
- Priority selection  

✅ **Task management**
- Mark task as completed
- Delete tasks
- Persist data (LocalStorage)

✅ **Professional & clean UI**
- User-friendly layout
- Responsive design

---

## Additional Features Added (Extra Improvements by Me)
### 1) 🔎 Search (Per Tab)
- Added separate search bars for **Personal** and **Professional**
- Real-time filtering without page refresh
- Displays “No match found” UI when nothing matches

### 2) 🏷️ Priority System + Badges
- Added **Low / Medium / High** priority dropdown
- Displayed priority as a stylish badge in the task card
- Placeholder “Choose Priority” added with disabled default option

### 3) ✅ Custom Toast Notifications (No Bootstrap Toast)
- Built a custom toast system for:
  - Task added
  - Task deleted
  - Task completed
  - Task updated
  - Sort actions
  - Reset confirmation
- Toast UI matches the glass design with smooth animations

### 4) ✏️ Inline Edit (Click to Edit)
- Users can click task text to edit instantly
- Enter to save / Escape to cancel
- Saves into LocalStorage immediately
- Fixed the bug where edit didn’t work until refresh

### 5) ↕️ Drag & Drop Reordering
- Tasks can be reordered by drag and drop
- Order persists in LocalStorage
- Smooth “Reordered” toast feedback

### 6) 📄 Pagination (5 Tasks per Page)
- Added **Bootstrap 5 styled pagination**
- Each page contains **5 tasks**
- Prevents long scrolling
- Includes smooth transitions on page change + auto scroll to the list

### 7) ✨ Smooth Animations + Micro UX
- Fade-out delete animation
- Completed task “settle” animation
- Smooth list transition on page change
- Better UI feedback on all actions

---

## How Data is Stored
All tasks are saved in LocalStorage under:
- `smart_todo_bootstrap_v2`

This includes:
- Task text
- Completed status
- Priority
- Due date
- Drag order

So the user will never lose tasks after reload.

---

## Folder / Files
