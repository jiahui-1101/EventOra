-- EventOra organiser dashboard demo data
-- Safe to run multiple times. It fills MySQL with realistic rows for:
-- events, registrations, tickets, and check-ins.

USE eventora;

INSERT INTO users (name, email, password_hash, role)
VALUES
    ('Test Organiser', 'testuser@example.com', 'DEMO_HASH_NOT_FOR_LOGIN', 'organiser'),
    ('Demo Attendee One', 'demo.attendee1@example.com', 'DEMO_HASH_NOT_FOR_LOGIN', 'attendee'),
    ('Demo Attendee Two', 'demo.attendee2@example.com', 'DEMO_HASH_NOT_FOR_LOGIN', 'attendee'),
    ('Demo Attendee Three', 'demo.attendee3@example.com', 'DEMO_HASH_NOT_FOR_LOGIN', 'attendee'),
    ('Demo Attendee Four', 'demo.attendee4@example.com', 'DEMO_HASH_NOT_FOR_LOGIN', 'attendee'),
    ('Demo Attendee Five', 'demo.attendee5@example.com', 'DEMO_HASH_NOT_FOR_LOGIN', 'attendee')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    role = VALUES(role);

-- Make the demo organiser easy to log in for local testing.
-- Email: testuser@example.com
-- Password: password123
UPDATE users
SET password_hash = '$2y$10$dOyOATeG2/yHy.yrmonwT.LSLv5tmvmDAeCfdpIHqcIXmfbwQqmqi'
WHERE email = 'testuser@example.com';

SET @organiser_id := (
    SELECT id FROM users WHERE email = 'testuser@example.com' LIMIT 1
);

INSERT INTO societies (name, description, created_by)
SELECT 'Computing Society', 'Demo society for organiser dashboard testing.', @organiser_id
WHERE NOT EXISTS (
    SELECT 1 FROM societies WHERE name = 'Computing Society'
);

SET @society_id := (
    SELECT id FROM societies WHERE name = 'Computing Society' LIMIT 1
);

INSERT INTO society_members (society_id, user_id, role)
VALUES (@society_id, @organiser_id, 'organiser')
ON DUPLICATE KEY UPDATE
    role = VALUES(role);

INSERT INTO events (
    society_id,
    created_by,
    title,
    description,
    venue,
    category,
    start_datetime,
    end_datetime,
    reg_deadline,
    capacity,
    fee_type,
    fee_amount,
    status
)
SELECT
    @society_id,
    @organiser_id,
    'Dashboard Demo Hackathon',
    'Demo event with confirmed, waitlisted, and checked-in attendees.',
    'N28A Innovation Lab',
    'academic',
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 3 HOUR,
    DATE_ADD(NOW(), INTERVAL 5 DAY),
    30,
    'free',
    0.00,
    'published'
WHERE NOT EXISTS (
    SELECT 1 FROM events
    WHERE title = 'Dashboard Demo Hackathon'
      AND society_id = @society_id
);

INSERT INTO events (
    society_id,
    created_by,
    title,
    description,
    venue,
    category,
    start_datetime,
    end_datetime,
    reg_deadline,
    capacity,
    fee_type,
    fee_amount,
    status
)
SELECT
    @society_id,
    @organiser_id,
    'Dashboard Demo Workshop',
    'Demo event waiting for admin approval.',
    'Dewan Seminar',
    'academic',
    DATE_ADD(NOW(), INTERVAL 14 DAY),
    DATE_ADD(NOW(), INTERVAL 14 DAY) + INTERVAL 2 HOUR,
    DATE_ADD(NOW(), INTERVAL 12 DAY),
    50,
    'free',
    0.00,
    'pending_approval'
WHERE NOT EXISTS (
    SELECT 1 FROM events
    WHERE title = 'Dashboard Demo Workshop'
      AND society_id = @society_id
);

SET @event_id := (
    SELECT id FROM events
    WHERE title = 'Dashboard Demo Hackathon'
      AND society_id = @society_id
    LIMIT 1
);

INSERT INTO registrations (event_id, user_id, status, waitlist_position)
SELECT @event_id, id, 'confirmed', NULL
FROM users
WHERE email IN ('demo.attendee1@example.com', 'demo.attendee2@example.com', 'demo.attendee3@example.com')
  AND NOT EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.event_id = @event_id
        AND registrations.user_id = users.id
  );

INSERT INTO registrations (event_id, user_id, status, waitlist_position)
SELECT @event_id, id, 'waitlisted', 1
FROM users
WHERE email = 'demo.attendee4@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.event_id = @event_id
        AND registrations.user_id = users.id
  );

INSERT INTO registrations (event_id, user_id, status, waitlist_position)
SELECT @event_id, id, 'cancelled', NULL
FROM users
WHERE email = 'demo.attendee5@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.event_id = @event_id
        AND registrations.user_id = users.id
  );

INSERT INTO tickets (registration_id, qr_token, status)
SELECT
    r.id,
    CONCAT('DEMO-DASHBOARD-QR-', r.id),
    'active'
FROM registrations r
JOIN users u ON u.id = r.user_id
WHERE r.event_id = @event_id
  AND r.status = 'confirmed'
  AND u.email IN ('demo.attendee1@example.com', 'demo.attendee2@example.com', 'demo.attendee3@example.com')
  AND NOT EXISTS (
      SELECT 1 FROM tickets WHERE tickets.registration_id = r.id
  );

INSERT INTO check_ins (ticket_id, checked_by, method)
SELECT t.id, @organiser_id, 'qr_scan'
FROM tickets t
JOIN registrations r ON r.id = t.registration_id
JOIN users u ON u.id = r.user_id
WHERE r.event_id = @event_id
  AND u.email IN ('demo.attendee1@example.com', 'demo.attendee2@example.com')
  AND NOT EXISTS (
      SELECT 1 FROM check_ins WHERE check_ins.ticket_id = t.id
  );
