# Nowshera Digital — Job Recruitment & Applicant Tracking System (ATS)

A modern, secure, role-based **Job Recruitment and Applicant Tracking System (ATS)** built to streamline the hiring process for candidates, recruiters, and administrators.

The system provides a complete recruitment workflow — from job creation and candidate applications to interviews, AI-assisted CV summaries, hiring decisions, and automated email notifications.

---

## 🚀 Project Overview

The **Nowshera Digital ATS** replaces manual recruitment processes with a centralized digital platform where:

* **Candidates** can discover jobs, upload CVs, apply, track applications, withdraw applications, and reapply.
* **Recruiters** can manage assigned applications, review CVs, use AI-generated summaries, manage recruitment stages, and schedule interviews.
* **Admins** can manage jobs, recruiters, assignments, and recruitment statistics.

The system is designed with **security, privacy, role-based access control, and human decision-making** as core principles.

---

## 👥 User Roles

### 👤 Candidate

Candidates can:

* Create an account and log in
* Create and manage their profile
* Upload PDF CVs
* Browse available jobs
* Apply for jobs
* Track application status
* View interview details
* Withdraw active applications
* Reapply after withdrawal with a new CV
* Receive automated email notifications

### 🧑‍💼 Recruiter

Recruiters can:

* Access assigned jobs only
* View candidate applications
* Access candidate CVs
* View AI-generated CV summaries
* Add private recruiter notes
* Manage recruitment stages
* Shortlist candidates
* Schedule interviews
* Make final Hired/Rejected decisions

### 🛡️ Admin

Administrators can:

* Create and manage jobs
* Create recruiter accounts
* Assign recruiters to jobs
* Manage recruitment data
* Monitor application statistics
* View recruitment dashboards
* Manage the overall recruitment system

---

## 🔄 Recruitment Pipeline

The system follows a controlled recruitment pipeline:

```text
Applied
   ↓
Shortlisted
   ↓
Interview
   ↓
Offer
   ↓
Hired
```

Candidates can also be:

```text
Applied ───────→ Rejected
Shortlisted ───→ Rejected
Interview ──────→ Rejected
Offer ──────────→ Rejected
```

Final states:

```text
Hired
Rejected
Withdrawn
```

The system prevents invalid backward transitions and stage skipping.

---

## 🤖 AI-Powered CV Summary

The ATS uses AI to assist recruiters with CV analysis.

For each application, the AI generates:

* **3–5 bullet candidate profile summary**
* Requirements found in the CV
* Requirements that could not be identified
* Exactly **3 interview questions**

### AI Safety

The AI does **not**:

* Score candidates
* Rank candidates
* Automatically hire candidates
* Automatically reject candidates
* Change application stages
* Make final hiring decisions
* Use sensitive personal attributes such as gender, religion, or marital status

Final recruitment decisions remain with authorized human recruiters.

---

## 📧 Automated Email Notifications

The system integrates with **n8n** for automated email workflows.

Supported events include:

* 📩 Application Received
* 📅 Interview Invitation
* 🎉 Hired Notification
* 📄 Rejected Notification
* 👋 Recruiter Account Setup

The system uses idempotency keys to help prevent duplicate emails.

---

## 🔐 Security & Privacy

Security is a major part of the system architecture.

### Role-Based Access Control

Each role has restricted access:

```text
Candidate
   ↓
Own Applications & CVs

Recruiter
   ↓
Assigned Jobs & Applications

Admin
   ↓
System Management
```

### CV Privacy

* CVs are stored in a **private Supabase Storage bucket**
* CV files are not publicly accessible
* Candidates can access only their own CVs
* Recruiters can access CVs for permitted applications
* Sensitive backend credentials are never exposed to the frontend

### Backend Authorization

Important authorization checks are performed server-side rather than relying only on frontend restrictions.

---

## 📋 Application Rules

The ATS implements several business rules:

### Duplicate Applications

A candidate cannot have more than one active application for the same job.

However:

```text
Application A
     ↓
  Withdrawn
     ↓
Application B
     ↓
  New CV
```

A candidate can reapply after withdrawing.

The previous application remains preserved as historical data.

### Job Status

Jobs can have:

* Draft
* Open
* Closed

Draft jobs are not publicly visible.

Closed jobs do not accept new applications.

### Interview Scheduling

Interviews:

* Are exactly 1 hour
* Must be scheduled in the future
* Require a location or meeting link
* Cannot overlap for the same recruiter
* Can only be scheduled for eligible candidates

---

## 🗄️ Database Structure

The application uses **Supabase PostgreSQL**.

Main entities include:

```text
profiles
jobs
job_recruiters
cvs
applications
application_stage_history
recruiter_notes
interviews
ai_summaries
email_events
```

This structure keeps recruitment data organized while supporting role-based access and application history.

---

## 🏗️ Technology Stack

| Technology       | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| Google AI Studio | Application development and AI-assisted implementation    |
| Supabase         | PostgreSQL database, authentication, storage and security |
| FastAPI / Python | Backend APIs and business logic                           |
| n8n              | Workflow automation and email processing                  |
| Gmail            | Automated email delivery                                  |
| AI               | CV summarization and interview-question generation        |

---

## 🔗 System Architecture

```text
                    ┌─────────────────────┐
                    │     Candidates      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   ATS Application   │
                    │    Frontend/UI      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │ Auth + Business     │
                    │      Logic          │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
          ┌─────────────────┐    ┌─────────────────┐
          │    Supabase     │    │       AI        │
          │ DB + Auth + CV  │    │ CV Summaries    │
          │    Storage      │    │ + Questions     │
          └─────────────────┘    └────────┬────────┘
                                         │
                                         ▼
                                  ┌───────────────┐
                                  │      n8n      │
                                  │  Automation   │
                                  └───────┬───────┘
                                          │
                                          ▼
                                  ┌───────────────┐
                                  │     Gmail     │
                                  │ Notifications │
                                  └───────────────┘
```

---

## 🧪 Testing

The system was designed and tested around important recruitment scenarios, including:

* Candidate application
* Duplicate application prevention
* Withdrawal and reapplication
* Recruitment pipeline transitions
* Job closing
* Interview scheduling
* Role-based authorization
* Candidate data privacy
* CV privacy
* AI CV summaries
* AI failure and retry
* Automated email notifications
* Hiring and rejection workflows
* Dashboard statistics
* Responsive UI

---

## 🎯 Key Features

✅ Role-based authenticat
