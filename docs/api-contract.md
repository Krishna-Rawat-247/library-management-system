# Atlas Room API Contract (Phase 1 to Phase 4)

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
| GET `/resources` | auth | Jasandeep | `getResources` | list, optional `?type=&zone=`. Phase 4: each row also has `hasSeatMap` and `seatCount`. |
| GET `/resources/:id` | auth | Jasandeep | `getResourceById` | one resource. Phase 4: also has `layout` (`{ rows, cols, seats: [{ row, col, label }] }`) for a room with a seat map. |
| GET `/resources/:id/availability?date=&startTime=&endTime=` | auth | Jasandeep | `getAvailability` | `{ capacity, booked, available }`. Phase 2: `booked` = seats of confirmed bookings (a group counts as its `groupSize`) |
| GET `/resources/:id/seats?date=&startTime=&endTime=` | auth | Lovish (Phase 4) | `getSeatMap` | the seat map of a room: `{ rows, cols, seats: [{ label, row, col, taken }] }`. `taken` is true when a confirmed booking holds that seat in that time. 400 if the room has no seat map or the date and times are wrong, 404 if the room does not exist |
| POST `/resources` | admin | Jasandeep | `createResource` | create (type must be one of the 7 allowed). Phase 4: optional `layout: { rows, cols, cells: [{ row, col }] }`. The server checks it, names the seats (A1, A2 ...) and sets `capacity` to the number of seats (a typed capacity is ignored). |
| PATCH `/resources/:id` | admin | Jasandeep | `updateResource` | edit. Phase 4: `layout` as above changes the seat map, `layout: null` removes it. A seat map cannot be changed or removed while the room has upcoming pending, confirmed, unallocated or waitlisted bookings (409). |
| DELETE `/resources/:id` | admin | Jasandeep | `deleteResource` | delete |
| POST `/reservations` | auth | Jasandeep | `createReservation` | Phase 2 body: `resourceId`, `date`, `startTime`, `endTime`, `purpose`, `eventDate`, `memberEmails` (array, optional). Times must be on `:00` or `:30`. Saved as `pending`; if an allocation run already exists for that `date` it is allocated at once. Answer has `status` (`pending`, `confirmed` or `unallocated`) and `reason` Phase 3: if the immediate allocation ends `unallocated`, an alternative `offer` is created when one is free (see below). The answer includes it. Phase 4: optional `preferredSeats` (list of seat names like `["A1","A2"]`) for a room with a seat map: the names must exist, no repeats, and as many as the group size. It is only a wish. The answer has `preferredSeats` and `seats`. |
| GET `/reservations/mine` | auth | Jasandeep | `getMyReservations` | own bookings and bookings where I am a group member. Each row: `purpose`, `groupSize`, `status`, `reason`, populated `resource` and `members` (name and email only), `isRequester` (true/false) and `requester { name }` Phase 3: each row also has `offer` (`{ resource {id, label, zone}, status, expiresAt }`), `originalResource` and, for `waitlisted` rows, `queuePosition`. Open offers that are too old are marked `expired` when they are read. Phase 4: each row also has `preferredSeats` and `seats` (only a confirmed booking has seats). |
| DELETE `/reservations/:id` | requester or admin | Jasandeep | `cancelReservation` | `pending`, `unallocated` or `confirmed` booking that has not started becomes `cancelled`. A group member cannot cancel Phase 3: `waitlisted` can be cancelled too. After a `confirmed` booking is cancelled the waitlist of that resource is reconsidered. |
| GET `/admin/reservations?status=&date=` | admin | Krishna | `getAllReservations` | all reservations, user and resource populated. Phase 2: `date` filter and `purpose`, `groupSize`, `priorityScore`, `reason` in each row Phase 3: each row also has `offer` and, for `waitlisted` rows, `queuePosition`. Phase 4: each row also has `preferredSeats` and `seats`. |
| POST `/admin/reservations/:id/confirm` | admin | Krishna | `confirmReservation` | force confirm a `waiting`, `pending`, `unallocated` or `bumped` booking. Goes through `allocateReservation`, so it can skip the priority order but never exceed capacity (409 if it does not fit, status unchanged) Phase 3: `waitlisted` can be force confirmed too. It also answers 409 if someone in the group already has a confirmed booking at that time, and it closes an open offer of the booking. |
| POST `/admin/reservations/:id/cancel` | admin | Krishna | `adminCancelReservation` | cancel Phase 3: after a `confirmed` booking is cancelled the waitlist is reconsidered, and `data.waitlistConfirmed` says how many waitlisted requests were confirmed. |
| POST `/admin/reservations/:id/no-show` | admin | Krishna | `markNoShow` | only after the start time. Status `no_show`, `user.noShowCount` +1 (display only), no automatic suspension |
| DELETE `/admin/reservations/:id` | admin | Krishna | `deleteReservation` | hard delete Phase 3: deleting a `confirmed` booking that has not started also reconsiders the waitlist (`data.waitlistConfirmed`). |
| GET `/exam-windows` | auth | Lovish (Phase 2) | `getExamWindows` | list, each window has `kind` |
| POST `/exam-windows` | admin | Lovish (Phase 2) | `createExamWindow` | body `{ title, startDate, endDate, kind }`, `kind` is `mid_semester_exam`, `end_semester_exam` or `other` |
| DELETE `/exam-windows/:id` | admin | Krishna | `deleteExamWindow` | delete |
| POST `/messages` | auth | Krishna | `sendMessage` | send a contact message to admin |
| GET `/messages` | auth | Krishna | `getMessages` | admin sees all, user sees own |
| PATCH `/messages/:id` | admin | Krishna | `updateMessage` | update `status` (`unread`/`read`) or `reply` |
| DELETE `/messages/:id` | admin | Krishna | `deleteMessage` | delete |
| POST `/admin/allocate` | admin | Lovish | `runAllocation` | body `{ date }` (`YYYY-MM-DD`). Ranks the `pending` and `unallocated` bookings of that date and allocates them one by one. Answer: summary (`considered`, `confirmed`, `unallocated`) and the list of decisions Phase 3: after the run an offer is created for every booking that ended `unallocated` (when one is free). The summary has `offersCreated`. Phase 4: each decision also has `seats`. |
| GET `/admin/allocation-runs` | admin | Lovish | `getAllocationRuns` | run history, newest first Phase 3: each run also has `offers`. |
| POST `/reservations/:id/offer/accept` | requester | Lovish (Phase 3) | `acceptOffer` | accept the open alternative offer of an `unallocated` booking. The seats are checked again. If it fits the booking becomes `confirmed` on the offered resource and `originalResource` remembers the first choice. If it no longer fits the offer becomes `expired` and the booking stays `unallocated` (409). An expired offer answers 409 |
| POST `/reservations/:id/offer/reject` | requester | Lovish (Phase 3) | `rejectOffer` | the offer becomes `rejected`, the booking stays `unallocated` |
| POST `/reservations/:id/waitlist` | requester | Lovish (Phase 3) | `joinWaitlist` | only from `unallocated` (409 otherwise). Status becomes `waitlisted`, `waitlistedAt` is saved and an open offer is closed |
| GET `/recommendations?date=&startTime=&endTime=&groupSize=&type=&zone=` | auth | Lovish (Phase 3) | `getRecommendations` | active resources with enough free seats for the whole group. Same type and zone first, then same type, then the others, each by most free seats, then label. No seats are held |
| GET `/health` | public | Lovish | (in `app.js`) | check the server is running |

## Allowed resource types
`study room`, `discussion_room`, `carrel`, `computer station`, `seminar hall`, `community study hall`, `reading pod`.

## Reservation statuses
Phase 2 statuses: `pending` (waiting for the allocation), `confirmed`, `unallocated` (did not fit), `cancelled`, `no_show`. Phase 3 adds `waitlisted` (the student chose to wait for a free seat). `completed`, `waiting`, `bumped` exist only for migrated history.

## Phase 2 rules in short
- Purpose tiers (strict): 5 `job_interview`, 4 `end_semester_exam`, 3 `mid_semester_exam`, 2 `quarterly_test` and `project_work`, 1 `general_study`.
- Order inside the allocation: tier, then score (role + reliability of the last 90 days), then `createdAt`, then `_id`.
- Only `confirmed` bookings use seats. A group needs `groupSize` seats and is never split.
- Dates and "has the booking started" use library time (`LIBRARY_UTC_OFFSET_MINUTES`, default 330).
- A confirmed booking is never bumped, revoked or reduced by a later request or run.

## Phase 3 rules in short (alternatives, waitlist, recommendations)
- A booking that ends `unallocated` gets at most ONE alternative offer, ever: another active resource of the same type with enough free seats for the whole group at the same date and time (same zone first, then most free seats, then label). If none is free there is no offer and the reason says so.
- `offer` = `{ resource, status (offered / accepted / rejected / expired), expiresAt, createdAt }`. It is only a suggestion, it does not hold seats. `expiresAt` is the earlier of now + `OFFER_MINUTES` (default 60, in `.env`) and the start of the booking. A booking that starts in less than 5 minutes gets no offer.
- Offers expire only when they are read or answered (no background job). An open offer on a booking that is no longer `unallocated` is closed the same way.
- Accepting checks the seats and whether anybody in the group is busy again. Rejecting keeps the booking `unallocated`. The first choice is never changed unless the student accepts (`originalResource` then shows it).
- `waitlisted` is always the student's choice (`POST /reservations/:id/waitlist`, only from `unallocated`). The admin allocation run does not include `waitlisted` bookings.
- The waitlist is reconsidered when a `confirmed` booking is cancelled or deleted: waitlisted bookings of the same resource and time are tried in the usual order (tier, score, `createdAt`, `_id`), each one only if the whole group fits and nobody in it is busy. Started bookings are skipped. A confirmed booking is never touched.
- Queue position = place in that order (1 = first).
- Shared helpers (Stage 0, frozen): `utils/alternatives.js` (`findCandidates`, `findAlternatives`, `createOffer`, `expireOfferIfNeeded`), `utils/waitlist.js` (`getQueue`, `getQueuePosition`, `reconsiderWaitlist`), `utils/allocation.js` (`findBusyPerson`), `utils/timeCheck.js` (`toLibraryDate`).

## Phase 4 rules in short (seat maps)
- A room can have a seat map: a grid of `rows` x `cols` squares (max 20 x 30). The squares that hold a seat are `seats`, every seat is named by its row letter and its number in that row (aisles are not counted): `A1`, `A2`, ... `B1` ... For such a room `capacity` is the number of seats. A room without a seat map works as before.
- The seats a student picks are only a wish (`preferredSeats`). The request stays `pending` and priority (tier, score, request time) still decides who gets the room.
- The capacity rule is unchanged (`getSeatsUsed` in `utils/allocation.js`). Only when a booking fits it gets its `seats` (`assignSeats` in `utils/seats.js`): the wished seats that are still free, else seats side by side in one row, and the rest from the free seats nearest to the first one. Only a `confirmed` booking holds seats. Cancelled, unallocated and waitlisted bookings hold none.
- Accepting an offer drops the old wish (the names belong to the old room) and gives seats in the new room. The waitlist, force confirm and the allocation run all go through `allocateReservation`, so they give seats the same way.
- Shared helpers (Stage 0, frozen): `utils/layout.js` (`buildLayout`, `makeCells`), `utils/seats.js` (`hasSeatMap`, `getTakenSeats`, `assignSeats`), `frontend/js/seatGrid.js` and `frontend/css/seats.css`. Until the owners finish their stages `GET /resources/:id/seats` answers 501.
