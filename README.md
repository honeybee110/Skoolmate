# SkoolMate

SchoolMate AU

AI-Powered Student Management Platform for Australian Special Developmental Schools

Project Vision

Build SchoolMate AU, a modern, AI-powered Student Management System (SMS) designed specifically for Australian Special Developmental Schools.

SchoolMate AU should combine the core administrative functionality of Compass with AI-powered planning, curriculum alignment, student analytics, behaviour and wellbeing tracking, evidence collection, and collaborative teaching tools.

The platform should reduce teacher administration, improve collaboration between educators and allied health professionals, and provide rich student insights to support personalised learning.

The experience should feel significantly faster, cleaner and more intuitive than Compass.  SchoolMate AU — Product Requirements Document (PRD)

1. Executive Summary

SchoolMate AU is an AI-powered Student Management System designed specifically for Australian Special Developmental Schools. It replaces fragmented systems by combining student management, curriculum planning, evidence collection, behaviour tracking, AI lesson planning, and reporting into one unified platform.

Unlike Compass, SchoolMate AU is:

 Evidence-first

 AI-assisted

 Built for Special Developmental Schools

 Workflow-driven (not form-driven)

It reduces teacher workload and ensures all data contributes to learning, IEPs, behaviour tracking, and reporting.

2. Product Vision

To build the most intuitive and intelligent school management system in Australia, enabling teachers to focus on students rather than administration.

Principles:

 No duplicate data entry

 Evidence becomes structured data automatically

 AI assists planning, teaching, and reporting

 Fast navigation (≤3 clicks anywhere)

 Strong collaboration between teachers and allied health staff

3. Design System

Brand:

 Teal (#0F9D94)

 White (#FFFFFF)

 Orange (#F7941D)

Style:

 Clean, modern, minimal

 Rounded cards

 Accessible (WCAG compliant)

 Dashboard-first UX

Inspired by:

 Compass (structure)

 Notion (simplicity)

 Canva (clarity)

4. User Roles

Teachers

 Lesson planning

 Student profiles

 Evidence collection

 Behaviour tracking

 IEP contributions

 Reporting

Allied Health Team

 View students

 Add therapy notes

 Upload assessments

 Contribute to IEPs

Learning Specialist

 Approve lesson plans

 Review curriculum alignment

 Oversee reports

Admin

 Manage users, students, system settings

 Compass integration

5. Compass Integration

Sync:

 Students

 Staff

 Classes

 Attendance

 Timetable

 Calendar

Supports scheduled sync.

6. Dashboards

Teacher Dashboard

Widgets:

 Timetable

 Notifications

 Lesson plans due

 Behaviour alerts

 Student snapshots

 IEP reminders

 Medication alerts

 Tasks

Class Dashboard

 8 student cards per class

 Quick access to profiles

 Behaviour + learning summary

 Attendance overview

7. Student Profile

Tabs:

 Personal info

 Medical info

 Learning profile

 IEP

 Behaviour & wellbeing

 Evidence hub

 Attendance

 Therapy notes

 Reports

Includes AI Student Snapshot (daily summary).

8. Learning Profile

Tracks curriculum by strand:

Mathematics:

 Number

 Measurement

 Space

English:

 Reading & Viewing

 Speaking & Listening

 Writing

Personal & Social:

 Self-awareness

 Self-management

 Social awareness

 Social management

Science:

 Biological

 Physical

 Earth & Space

 Chemical

PE:

 Movement

 Health

 Teamwork

Arts:

 Drama

 Visual Arts

Learn to Play:

 Turn-taking

 Social interaction

 Independent play

Tracks progression across 4 terms.

9. Resource Bank

Categories:

 Numeracy

 Literacy

 Electives

Includes:

 Twinkl

 Topmarks

 Starfall

 Boardmaker

 Canva

Features:

 Search

 Tags

 Favourites

 AI recommendations

10. AI Lesson Planner

Aligned to Victorian Curriculum 2.0.

Generates:

 Learning intention

 Success criteria

 Hook

 I Do / We Do / You Do

 Differentiation

 AAC supports

 Sensory supports

 Behaviour supports

Auto-suggests resources.

11. Lesson Approval Workflow

 Teacher creates lesson

 AI assists

 Teacher submits

 Learning Specialist reviews

 Approve or return

12. IEP System

AI-assisted goal creation:

 Goal selection

 Entry skills

 Curriculum mapping

 Evidence suggestions

13. Cross-Check Progress

Each goal has 3 stages:

 Developing

 Working Towards

 Achieved

Automatically calculates progress.

14. Student Evidence Hub

Stores:

 Photos

 Videos

 Documents

 AAC samples

 Work samples

Auto-links to:

 Curriculum

 IEP goals

 Behaviour

 Reports

AI suggests tagging and usage.

15. Behaviour & Wellbeing Dashboard

Tracks:

 Incident frequency

 Positive behaviours

 ABC data

 Triggers

 Time + location patterns

Includes:

 Heatmaps

 Severity indicators

 Behaviour trends

AI insights:

 Patterns

 Triggers

 Suggested supports

16. AI Student Snapshot

Daily summary:

 Learning progress

 Behaviour updates

 Therapy schedule

 Alerts

 Attendance issues

17. Calendar & Notifications

Includes:

 Lessons

 Meetings

 Therapy

 Medication

 Due dates

 Reports

18. AI Assistant

Can:

 Generate lessons

 Write reports

 Summarise students

 Suggest interventions

 Find resources

19. Search

Global search across:

 Students

 Lessons

 Evidence

 Reports

 Curriculum

20. AI Reporting System

Generates:

 Semester reports

 IEP reports

 Behaviour reports

Uses:

 Evidence Hub

 Learning Profile

 Behaviour data

 Curriculum alignment

21. IEP Reports (KEY FEATURE)

Each subject includes:

 Teacher comments

 Curriculum level

 Progress summary

 Up to 3 photos per subject (from Evidence Hub)

Workflow:

 AI draft

 Teacher edits

 Learning Specialist approval

 Leadership approval

 PDF generated

 Published to Parent Portal

22. Parent Reports Portal (Reports Only)

Parents can view:

 Approved IEP reports

 Downloadable PDFs

 Report history

No live learning feed (SeeSaw already used).

23. Behaviour Analytics

Includes:

 Heatmaps

 Trigger analysis

 Behaviour functions

 Severity tracking

 Positive behaviour tracking

24. Analytics Dashboard

Shows:

 Student progress

 Curriculum coverage

 Behaviour trends

 Attendance

 Evidence usage

25. Technology Stack

Frontend:

 React

 TypeScript

 Tailwind

 shadcn/ui

Backend:

 Supabase

 PostgreSQL

 Edge Functions

AI:

 OpenAI GPT

 Embeddings (RAG)

26. UX Goals

 ≤3 clicks to any feature

 Evidence-first design

 AI reduces admin workload

 Fast, simple navigation

 Minimal duplication

27. Future Enhancements

 Predictive behaviour intervention

 Voice-to-evidence capture

 Automated intervention plans

 School benchmarking tools

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/323819d8-e41f-4ba5-a370-34e72ff59c2c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
