# Atlas Room API Contract (Phase 1 and Phase 2)

Shared agreement between the 3 members. Do not change a path or a response shape without telling the others.
All paths start with `/api`. Protected routes need the header `Authorization: Bearer <token>`.
"auth" = valid JWT. "admin" = valid JWT with `role: "admin"`.

## Response shape
- Success: `{ "message": "...", "data": ... }` (login and signup also send `token` and `user`).
- Error: `{ "message": "..." }`.
- Status codes: 200 OK, 201 created, 400 validation, 401 no/invalid token, 403 wrong role or suspended, 404 not found, 409 conflict (duplicate email, slot full, overlapping booking), 501 not implemented yet (stubs).
- Dates and times are strings: `"2026-10-25"`, `"10:00"`.

## Endpoints

| Method + path | Access | Owner | Controller function | Purpose |
|---|---|---|---|---|
| POST `/auth/signup` | public | Lovish | `signup` | validate, hash, create user (role forced to `student`), return `{ token, user }` |
| POST `/auth/login` | public | Lovish | `login` | find by email, `bcrypt.compare`, return `{ token, user }` |
| GET `/auth/me` | auth | Lovish | `getMe` | current user without password. Phase 2: also `priority: { roleScore, reliabilityScore, recentNoShows }` |
| PATCH `/users/me` | auth | Lovish | `updateMe` | update own name, department, course, semester only |
| GET `/admin/users` | admin | Lovish | `getAllUsers` | list users without passwords. Phase 2: each user also has `priority: { roleScore, reliabilityScore, recentNoShows }` |
| PATCH `/admin/users/:id` | admin | Lovish | `changeRole` | change role |
| POST `/admin/users/:id/suspend` | admin | Lovish | `suspendUser` | body `{ days, reason }` (days 1, 7, 30 or null for indefinite) |
| POST `/admin/users/:id/unsuspend` | admin | Lovish | `unsuspendUser` | clear suspension |
| GET `/resources` | auth | Jasandeep | `getResources` | list, optional `?type=&zone=` |
| GET `/resources/:id` | auth | Jasandeep | `getResourceById` | one resource |
| GET `/resources/:id/availability?date=&startTime=&endTime=` | auth | Jasandeep | `getAvailability` | `{ capacity, booked, available }`. Phase 2: `booked` = seats of confirmed bookings (a group counts as its `groupSize`) |
| POST `/resources` | admin | Jasandeep | `createResource` | create (type must be one of the 7 allowed) |
| PATCH `/resources/:id` | admin | Jasandeep | `updateResource` | edit |
| DELETE `/resources/:id` | admin | Jasandeep | `deleteResource` | delete |
| POST `/reservations` | auth | Jasandeep | `createReservation` | Phase 2 body: `resourceId`, `date`, `startTime`, `endTime`, `purpose`, `eventDate`, `memberEmails` (array, optional). Times must be on `:00` or `:30`. Saved as `pending`; if an allocation run already exists for that `date` it is allocated at once. Answer has `status` (`pending`, `confirmed` or `unallocated`) and `reason` |
| GET `/reservations/mine` | auth | Jasandeep | `getMyReservations` | own bookings and bookings where I am a group member. Each row: `purpose`, `groupSize`, `status`, `reason`, populated `resource` and `members` (name and email only), `isRequester` (true/false) and `requester { name }` |
| DELETE `/reservations/:id` | requester or admin | Jasandeep | `cancelReservation` | `pending`, `unallocated` or `confirmed` booking that has not started becomes `cancelled`. A group member cannot cancel |
| GET `/admin/reservations?status=&date=` | admin | Krishna | `getAllReservations` | all reservations, user and resource populated. Phase 2: `date` filter and `purpose`, `groupSize`, `priorityScore`, `reason` in each row |
| POST `/admin/reservations/:id/confirm` | admin | Krishna | `confirmReservation` | force confirm a `waiting`, `pending`, `unallocated` or `bumped` booking. Goes through `allocateReservation`, so it can skip the priority order but never exceed capacity (409 if it does not fit, status unchanged) |
| POST `/admin/reservations/:id/cancel` | admin | Krishna | `adminCancelReservation` | cancel |
| POST `/admin/reservations/:id/no-show` | admin | Krishna | `markNoShow` | only after the start time. Status `no_show`, `user.noShowCount` +1 (display only), no automatic suspension |
| DELETE `/admin/reservations/:id` | admin | Krishna | `deleteReservation` | hard delete |
| GET `/exam-windows` | auth | Lovish (Phase 2) | `getExamWindows` | list, each window has `kind` |
| POST `/exam-windows` | admin | Lovish (Phase 2) | `createExamWindow` | body `{ title, startDate, endDate, kind }`, `kind` is `mid_semester_exam`, `end_semester_exam` or `other` |
| DELETE `/exam-windows/:id` | admin | Krishna | `deleteExamWindow` | delete |
| POST `/messages` | auth | Krishna | `sendMessage` | send a contact message to admin |
| GET `/messages` | auth | Krishna | `getMessages` | admin sees all, user sees own |
| PATCH `/messages/:id` | admin | Krishna | `updateMessage` | update `status` (`unread`/`read`) or `reply` |
| DELETE `/messages/:id` | admin | Krishna | `deleteMessage` | delete |
| POST `/admin/allocate` | admin | Lovish | `runAllocation` | body `{ date }` (`YYYY-MM-DD`). Ranks the `pending` and `unallocated` bookings of that date and allocates them one by one. Answer: summary (`considered`, `confirmed`, `unallocated`) and the list of decisions |
| GET `/admin/allocation-runs` | admin | Lovish | `getAllocationRuns` | run history, newest first |
| GET `/health` | public | Lovish | (in `app.js`) | check the server is running |

## Allowed resource types
`study room`, `discussion_room`, `carrel`, `computer station`, `seminar hall`, `community study hall`, `reading pod`.

## Reservation statuses
Phase 2 statuses: `pending` (waiting for the allocation), `confirmed`, `unallocated` (did not fit), `cancelled`, `no_show`. `completed`, `waiting`, `bumped` exist only for migrated history.

## Phase 2 rules in short
- Purpose tiers (strict): 5 `job_interview`, 4 `end_semester_exam`, 3 `mid_semester_exam`, 2 `quarterly_test` and `project_work`, 1 `general_study`.
- Order inside the allocation: tier, then score (role + reliability of the last 90 days), then `createdAt`, then `_id`.
- Only `confirmed` bookings use seats. A group needs `groupSize` seats and is never split.
- Dates and "has the booking started" use library time (`LIBRARY_UTC_OFFSET_MINUTES`, default 330).
- A confirmed booking is never bumped, revoked or reduced by a later request or run.
