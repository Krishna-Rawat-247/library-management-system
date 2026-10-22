# Atlas Room API Contract (Phase 1)

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
| GET `/auth/me` | auth | Lovish | `getMe` | current user without password |
| PATCH `/users/me` | auth | Lovish | `updateMe` | update own name, department, course, semester only |
| GET `/admin/users` | admin | Lovish | `getAllUsers` | list users without passwords |
| PATCH `/admin/users/:id` | admin | Lovish | `changeRole` | change role |
| POST `/admin/users/:id/suspend` | admin | Lovish | `suspendUser` | body `{ days, reason }` (days 1, 7, 30 or null for indefinite) |
| POST `/admin/users/:id/unsuspend` | admin | Lovish | `unsuspendUser` | clear suspension |
| GET `/resources` | auth | Jasandeep | `getResources` | list, optional `?type=&zone=` |
| GET `/resources/:id` | auth | Jasandeep | `getResourceById` | one resource |
| GET `/resources/:id/availability?date=&startTime=&endTime=` | auth | Jasandeep | `getAvailability` | `{ capacity, booked, available }` |
| POST `/resources` | admin | Jasandeep | `createResource` | create (type must be one of the 7 allowed) |
| PATCH `/resources/:id` | admin | Jasandeep | `updateResource` | edit |
| DELETE `/resources/:id` | admin | Jasandeep | `deleteResource` | delete |
| POST `/reservations` | auth | Jasandeep | `createReservation` | create booking (Phase 1 plan section 7) |
| GET `/reservations/mine` | auth | Jasandeep | `getMyReservations` | own bookings, resource populated |
| DELETE `/reservations/:id` | owner or admin | Jasandeep | `cancelReservation` | status becomes `cancelled`, only before start time |
| GET `/admin/reservations?status=` | admin | Krishna | `getAllReservations` | all reservations, user and resource populated |
| POST `/admin/reservations/:id/confirm` | admin | Krishna | `confirmReservation` | force confirm with capacity check |
| POST `/admin/reservations/:id/cancel` | admin | Krishna | `adminCancelReservation` | cancel |
| POST `/admin/reservations/:id/no-show` | admin | Krishna | `markNoShow` | status `no_show`, `user.noShowCount` +1, no automatic suspension |
| DELETE `/admin/reservations/:id` | admin | Krishna | `deleteReservation` | hard delete |
| GET `/exam-windows` | auth | Krishna | `getExamWindows` | list |
| POST `/exam-windows` | admin | Krishna | `createExamWindow` | body `{ title, startDate, endDate }` |
| DELETE `/exam-windows/:id` | admin | Krishna | `deleteExamWindow` | delete |
| POST `/messages` | auth | Krishna | `sendMessage` | send a contact message to admin |
| GET `/messages` | auth | Krishna | `getMessages` | admin sees all, user sees own |
| PATCH `/messages/:id` | admin | Krishna | `updateMessage` | update `status` (`unread`/`read`) or `reply` |
| DELETE `/messages/:id` | admin | Krishna | `deleteMessage` | delete |
| GET `/health` | public | Lovish | (in `app.js`) | check the server is running |

## Allowed resource types
`study room`, `discussion_room`, `carrel`, `computer station`, `seminar hall`, `community study hall`, `reading pod`.

## Reservation statuses
New code creates only `confirmed`, `cancelled`, `no_show`. `completed`, `waiting`, `bumped`, `pending` exist only for migrated history.
