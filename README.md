
# DBMS Normalization Web Tool

## 📝 Overview

This web-based tool is designed to help users visualize and compute various **database normalization operations**, including:
- Functional dependency comparisons
- Minimal cover finding
- Normal form analysis (1NF, 2NF, 3NF, BCNF)

## 📁 Project Structure

```
dbms_project/
│
├── index.html                   # Main landing page
├── attributes.html              # Page to input attributes
├── fd-comparison.html           # FD comparison interface
├── minimal-cover.html           # Minimal cover computation
├── normal-form.html             # Normal form checker
│
├── attributes.js                # JS logic for attribute processing
├── fd-comparison.js             # JS logic for FD comparison
├── minimal-cover.js             # JS for minimal cover algorithm
├── normal-form.js               # JS for normal form detection
├── script.js                    # Shared or root logic
├── shared-functions.js          # Common JS functions
│
├── styles.css                   # Styling for all pages
├── README.md                    # Basic project info
└── .vscode/
    └── launch.json              # VSCode debugger config
```

## 🚀 How to Run

1. Open `index.html` in any modern web browser.
2. Navigate between pages using the buttons or links.
3. Input functional dependencies and attributes as required.
4. View results for closure, minimal cover, and normal form analysis.

> 📌 No server or database setup required. It runs purely on client-side using JavaScript.

## ✨ Features

- Clean UI for inputting and analyzing functional dependencies
- Minimal cover and closure computation
- BCNF decomposition checker
- Interactive JavaScript logic
- Modular code organization

## 🛠️ Technologies Used

- **HTML5**
- **CSS3**
- **JavaScript**
