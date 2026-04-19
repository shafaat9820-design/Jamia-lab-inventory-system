# Jamia Lab Inventory System
### Project by JMI University Polytechnic Computer Engg 6th Sem Students
**Team: Shafaat, Farman, Aqdas, Rihan, Farhan**

A web application for managing laboratory inventory, tracking assets, and handling procurement for **Jamia Millia Islamia**.

## Features
* **Role Based Access:** Different logins for Principal, Store Keeper, Lab Incharge, and Assistant.
* **Inventory Tracking:** Manage assets, category, and budgets.
* **Dead Inventory:** Track non-working and condemned items.
* **Reports:** Generate PDF reports for GFR-17, depreciation, and inventory.

## Tech Stack
* **Frontend:** React, Tailwind CSS, Vite.
* **Backend:** Node.js, Express, PostgreSQL.
* **Database:** Drizzle ORM.

## Setup
1. Clone the repo.
2. Run `npm install`.
3. Create a `.env` file with `DATABASE_URL`, `SESSION_SECRET`, `BREVO_API_KEY`, and `BREVO_SENDER`.
4. Run `npm run db:push` to setup database.
5. Run `npm run dev` to start the app.

---
*College Project - JMI University Polytechnic*
