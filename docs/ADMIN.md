# Admin Guide

## Accessing the Admin Panel

1. Navigate to http://localhost:3000/admin
2. Log in with the admin credentials:
   - **Email:** admin@bheda.lab
   - **Password:** admin

---

## Managing Users

### Viewing Users
Navigate to **Admin → Users** to see all registered users with:
- Email, username, role, registration date
- Last login timestamp
- Current team and event participation
- Challenge completion count

### User Actions
- **Edit Role:** Change between `user`, `admin`, `moderator`
- **Verify Email:** Manually verify a user's email
- **Disable/Enable:** Suspend or restore user accounts
- **Delete:** Remove a user and their submissions (irreversible)

### Bulk Operations
Use the checkbox selector to:
- Delete multiple users
- Export user data as CSV
- Assign roles in bulk

---

## Managing Challenges

### Challenge Catalog
Navigate to **Admin → Challenges** for a full view of all 221 challenges across all categories.

### Toggle Individual Challenges
Each challenge card has a toggle switch:
- **Enabled (green):** Visible and solvable in the lab
- **Disabled (red):** Hidden from the challenge catalog

Changes take effect immediately — no restart needed.

### Bulk Toggle
Use the **Bulk Actions** panel:
```bash
# Enable all SQLi challenges
Category: SQL Injection → Action: Enable

# Disable all WAF bypass challenges
Category: WAF Bypass → Action: Disable

# Enable by difficulty
Difficulty: Expert → Action: Enable
```

### Category Toggle
Navigate to **Admin → Categories** to enable/disable entire categories at once.

### Challenge Metadata
Each challenge supports the following editable fields:
- Title, description, difficulty, CVSS score
- OWASP mapping, CVE reference
- Hints (add/remove/reorder)
- Flag value and location

### Schedule Challenge Availability
Use the schedule tab to set time-based rules:
- **Always enabled** (default for practice)
- **Time window** (e.g., 9 AM – 5 PM)
- **Event-bound** (only during specific CTF events)
- **Prerequisite-based** (unlock after solving other challenges)

---

## Creating CTF Events

Navigate to **Admin → Events → Create Event**.

| Field | Description | Example |
|-------|-------------|---------|
| Title | Event name | "Spring CTF 2026" |
| Description | Event description | "48-hour competition..." |
| Start Time | UTC start | 2026-05-01 14:00:00 |
| End Time | UTC end | 2026-05-03 14:00:00 |
| Max Team Size | Players per team | 5 |
| Scoring Mode | Dynamic/Static/Fixed | dynamic |
| Min Points | Minimum flag value | 50 |
| Max Points | Maximum flag value | 500 |
| Decay Function | Point decay curve | linear |
| Allowed Categories | Selectable categories | All |
| Anti-Cheat | Enable duplicate detection | true |
| Per-Team Instances | Isolated environments | true |

### Event Lifecycle
1. **Draft:** Edit and configure before publishing
2. **Active:** Competition is running, live leaderboard
3. **Paused:** Toggle freeze submissions during incidents
4. **Completed:** Scoring frozen, results final

### Live Monitoring
During active events, the **Monitor** tab shows:
- Real-time submission feed
- Team score progression charts
- Challenge solve heatmap
- Instance health status
- Potential flag sharing alerts

---

## Managing Profiles

The profile system allows users to save and restore their progress.

Navigate to **Admin → Profiles** to:
- View all user profiles
- Delete stale/inactive profiles
- Export profile data for analysis
- Force-sync profiles between storage backends

Profiles store:
- Solved challenges and timestamps
- Progress on partial completions
- Custom workspace state
- Hint usage history

---

## Setting Schedules

Navigate to **Admin → Schedule** to configure time-based automation.

### Schedule Types
- **Event Schedules:** Automatically start/stop CTF events
- **Challenge Windows:** Enable challenges at specific times
- **Maintenance Windows:** Disable the lab during updates
- **Content Releases:** Automatically publish new challenges

### Schedule Format
```yaml
- name: "Daily flag reset"
  type: recurring
  cron: "0 0 * * *"
  action: reset_flags
  target: all

- name: "Weekend intermediate challenges"
  type: recurring
  cron: "0 9 * * SAT,SUN"
  action: enable_category
  target: intermediate
  params:
    duration_hours: 48
```

---

## Monitoring Live Telemetry

Navigate to **Admin → Monitor** for real-time observability.

### Dashboard Widgets
- **Active Users:** Current logged-in sessions
- **Requests/Min:** API request rate with spike alerts
- **Challenge Solves:** Real-time solve feed
- **Error Rate:** 4xx/5xx error tracking
- **Avg Response Time:** API latency metrics (p50/p95/p99)
- **Flag Submissions:** Total + unique submission count
- **WAF Blocked Requests:** ModSecurity denial count

### Alerts
Configure alerts for:
- Unusual submission patterns (potential cheating)
- Service health degradation
- Resource exhaustion
- Concurrent team-instance spikes

### Logs
Search and filter logs by:
- Service (backend, vuln-app, waf, etc.)
- Severity (DEBUG, INFO, WARN, ERROR)
- User ID or team ID
- Challenge ID
- Time range

---

## Managing Rabbit Holes

Navigate to **Admin → Rabbit Holes** to manage the 51 distracting endpoints.

### Rabbit Hole Types
| Type | Count | Description |
|------|-------|-------------|
| Decoy Endpoints | 20 | Fake admin panels, debug endpoints |
| Dead-End Chains | 8 | Multi-step paths leading nowhere |
| Honeypot Services | 4 | Fake microservices (payment, user-sync, etc.) |
| Circular Resources | 3 | Infinite redirect loops |
| Deceptive Responses | 16 | Fake flags, misleading error messages |

### Toggling Rabbit Holes
- Enable/disable individual rabbit holes
- Toggle by type category
- Set probability weights (how likely the rabbit hole triggers)

### Detection Risk
Each rabbit hole has a detection risk level that determines WAF/SIEM alert behavior. High-risk rabbit holes trigger immediate telemetry alerts when accessed.

---

## Viewing Submissions

Navigate to **Admin → Submissions** for the full submission log.

### Submission Table
| Column | Description |
|--------|-------------|
| User | Submitter's email/username |
| Challenge | Challenge ID and title |
| Flag | Submitted flag value |
| Status | Correct / Incorrect / Duplicate |
| Timestamp | Submission time (UTC) |
| IP | Submitter IP address |
| Team | Team ID (CTF mode) |

### Filters
- By challenge, user, team, status
- Date range picker
- Search by flag fragment

### Export
Export submissions to CSV or JSON for offline analysis.
