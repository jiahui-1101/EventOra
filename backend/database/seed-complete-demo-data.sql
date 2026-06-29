USE eventora;

-- Complete EventOra demo data for deploy/demo.
-- Safe to run multiple times. It does NOT drop existing data.
--
-- Demo login accounts, all using password: password123
--   admin@example.com
--   computing.organiser@example.com
--   robotics.organiser@example.com
--   culture.organiser@example.com
--   attendee1@example.com
--   attendee2@example.com
--   attendee3@example.com
--   attendee4@example.com

SET @demo_password_hash := '$2y$10$dOyOATeG2/yHy.yrmonwT.LSLv5tmvmDAeCfdpIHqcIXmfbwQqmqi';

INSERT INTO users (name, email, password_hash, role, matric_no, phone)
VALUES
    ('Faculty Admin', 'admin@example.com', @demo_password_hash, 'faculty_admin', NULL, '+60 12-000 1000'),
    ('Computing Society Organiser', 'computing.organiser@example.com', @demo_password_hash, 'organiser', NULL, '+60 12-000 2001'),
    ('Robotics Club Organiser', 'robotics.organiser@example.com', @demo_password_hash, 'organiser', NULL, '+60 12-000 2002'),
    ('Cultural Arts Organiser', 'culture.organiser@example.com', @demo_password_hash, 'organiser', NULL, '+60 12-000 2003'),
    ('Aina Rahman', 'attendee1@example.com', @demo_password_hash, 'attendee', 'A23CS0010', '+60 12-000 3001'),
    ('Daniel Tan', 'attendee2@example.com', @demo_password_hash, 'attendee', 'A23CS0011', '+60 12-000 3002'),
    ('Priya Nair', 'attendee3@example.com', @demo_password_hash, 'attendee', 'A23CS0012', '+60 12-000 3003'),
    ('Lim Jia Wei', 'attendee4@example.com', @demo_password_hash, 'attendee', 'A23CS0013', '+60 12-000 3004')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password_hash = VALUES(password_hash),
    role = VALUES(role),
    matric_no = VALUES(matric_no),
    phone = VALUES(phone);

SET @admin_id := (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1);
SET @computing_org_id := (SELECT id FROM users WHERE email = 'computing.organiser@example.com' LIMIT 1);
SET @robotics_org_id := (SELECT id FROM users WHERE email = 'robotics.organiser@example.com' LIMIT 1);
SET @culture_org_id := (SELECT id FROM users WHERE email = 'culture.organiser@example.com' LIMIT 1);
SET @attendee1_id := (SELECT id FROM users WHERE email = 'attendee1@example.com' LIMIT 1);
SET @attendee2_id := (SELECT id FROM users WHERE email = 'attendee2@example.com' LIMIT 1);
SET @attendee3_id := (SELECT id FROM users WHERE email = 'attendee3@example.com' LIMIT 1);
SET @attendee4_id := (SELECT id FROM users WHERE email = 'attendee4@example.com' LIMIT 1);

INSERT INTO societies (name, description, created_by)
SELECT 'Computing Society', 'Technology workshops, hackathons, and career events for computing students.', @admin_id
WHERE NOT EXISTS (SELECT 1 FROM societies WHERE name = 'Computing Society');

INSERT INTO societies (name, description, created_by)
SELECT 'Robotics Club', 'Hands-on robotics, embedded systems, and autonomous machine projects.', @admin_id
WHERE NOT EXISTS (SELECT 1 FROM societies WHERE name = 'Robotics Club');

INSERT INTO societies (name, description, created_by)
SELECT 'Cultural Arts Club', 'Campus cultural showcases, performances, and creative student activities.', @admin_id
WHERE NOT EXISTS (SELECT 1 FROM societies WHERE name = 'Cultural Arts Club');

SET @computing_society_id := (SELECT id FROM societies WHERE name = 'Computing Society' LIMIT 1);
SET @robotics_society_id := (SELECT id FROM societies WHERE name = 'Robotics Club' LIMIT 1);
SET @culture_society_id := (SELECT id FROM societies WHERE name = 'Cultural Arts Club' LIMIT 1);

INSERT INTO society_members (society_id, user_id, role)
VALUES
    (@computing_society_id, @computing_org_id, 'organiser'),
    (@robotics_society_id, @robotics_org_id, 'organiser'),
    (@culture_society_id, @culture_org_id, 'organiser')
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO organiser_society_requests (user_id, society_name, society_description, status, reviewed_by, reviewed_at)
VALUES
    (@computing_org_id, 'Computing Society', 'Technology workshops, hackathons, and career events for computing students.', 'approved', @admin_id, NOW()),
    (@robotics_org_id, 'Robotics Club', 'Hands-on robotics, embedded systems, and autonomous machine projects.', 'approved', @admin_id, NOW()),
    (@culture_org_id, 'Cultural Arts Club', 'Campus cultural showcases, performances, and creative student activities.', 'approved', @admin_id, NOW())
ON DUPLICATE KEY UPDATE
    status = 'approved',
    reviewed_by = @admin_id,
    reviewed_at = COALESCE(reviewed_at, NOW()),
    rejection_reason = NULL;

INSERT INTO events (
    society_id, created_by, title, description, venue, category,
    start_datetime, end_datetime, reg_deadline, capacity,
    fee_type, fee_amount, waitlist_enabled, contact_person,
    contact_email, special_instructions, status
)
SELECT @computing_society_id, @computing_org_id, 'AI Builder Bootcamp',
    'A practical workshop where students build and present a small AI-powered campus utility.',
    'N28A Innovation Lab', 'workshop',
    DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 4 HOUR,
    DATE_SUB(NOW(), INTERVAL 12 DAY), 40, 'free', 0.00, 1,
    'Siti Noor', 'computing.society@utm.my', 'Bring a laptop with a modern browser installed.', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'AI Builder Bootcamp' AND society_id = @computing_society_id);

INSERT INTO events (
    society_id, created_by, title, description, venue, category,
    start_datetime, end_datetime, reg_deadline, capacity,
    fee_type, fee_amount, waitlist_enabled, contact_person,
    contact_email, special_instructions, status
)
SELECT @computing_society_id, @computing_org_id, 'Hackathon 2026',
    'A full-day hackathon for student teams to build working software solutions and pitch to judges.',
    'Dewan Seminar N28', 'academic',
    DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY) + INTERVAL 8 HOUR,
    DATE_ADD(NOW(), INTERVAL 10 DAY), 80, 'paid', 15.00, 1,
    'Aiman Hakim', 'hackathon@utm.my', 'Teams of 3 to 5. Bring student ID for check-in.', 'published'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Hackathon 2026' AND society_id = @computing_society_id);

INSERT INTO events (
    society_id, created_by, title, description, venue, category,
    start_datetime, end_datetime, reg_deadline, capacity,
    fee_type, fee_amount, waitlist_enabled, contact_person,
    contact_email, special_instructions, status
)
SELECT @robotics_society_id, @robotics_org_id, 'Autonomous Robot Challenge',
    'Students build line-following robots and compete in timed challenge rounds.',
    'P19 Robotics Lab', 'workshop',
    DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY) + INTERVAL 5 HOUR,
    DATE_SUB(NOW(), INTERVAL 21 DAY), 36, 'free', 0.00, 1,
    'Razif Johan', 'robotics@utm.my', 'Basic Arduino knowledge recommended.', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Autonomous Robot Challenge' AND society_id = @robotics_society_id);

INSERT INTO events (
    society_id, created_by, title, description, venue, category,
    start_datetime, end_datetime, reg_deadline, capacity,
    fee_type, fee_amount, waitlist_enabled, contact_person,
    contact_email, special_instructions, status
)
SELECT @robotics_society_id, @robotics_org_id, 'Drone Safety Seminar',
    'A safety and compliance briefing before students fly drones for campus projects.',
    'N24 Seminar Room', 'academic',
    DATE_ADD(NOW(), INTERVAL 9 DAY), DATE_ADD(NOW(), INTERVAL 9 DAY) + INTERVAL 2 HOUR,
    DATE_ADD(NOW(), INTERVAL 6 DAY), 60, 'free', 0.00, 1,
    'Hana Lee', 'drone.safety@utm.my', 'Participants must bring student ID.', 'pending_approval'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Drone Safety Seminar' AND society_id = @robotics_society_id);

INSERT INTO events (
    society_id, created_by, title, description, venue, category,
    start_datetime, end_datetime, reg_deadline, capacity,
    fee_type, fee_amount, waitlist_enabled, contact_person,
    contact_email, special_instructions, status
)
SELECT @culture_society_id, @culture_org_id, 'Campus Cultural Night',
    'An evening of student performances, cultural booths, music, and food showcases.',
    'Dewan Sultan Iskandar', 'cultural',
    DATE_ADD(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY) + INTERVAL 4 HOUR,
    DATE_ADD(NOW(), INTERVAL 16 DAY), 180, 'paid', 8.00, 1,
    'Mei Lin', 'culture@utm.my', 'Smart casual attire encouraged.', 'published'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Campus Cultural Night' AND society_id = @culture_society_id);

SET @ai_event_id := (SELECT id FROM events WHERE title = 'AI Builder Bootcamp' AND society_id = @computing_society_id LIMIT 1);
SET @hackathon_event_id := (SELECT id FROM events WHERE title = 'Hackathon 2026' AND society_id = @computing_society_id LIMIT 1);
SET @robot_event_id := (SELECT id FROM events WHERE title = 'Autonomous Robot Challenge' AND society_id = @robotics_society_id LIMIT 1);
SET @drone_event_id := (SELECT id FROM events WHERE title = 'Drone Safety Seminar' AND society_id = @robotics_society_id LIMIT 1);
SET @culture_event_id := (SELECT id FROM events WHERE title = 'Campus Cultural Night' AND society_id = @culture_society_id LIMIT 1);

INSERT INTO event_approvals (event_id, reviewed_by, decision, reason)
SELECT event_id, @admin_id, 'approved', NULL
FROM (
    SELECT @ai_event_id AS event_id
    UNION ALL SELECT @hackathon_event_id
    UNION ALL SELECT @robot_event_id
    UNION ALL SELECT @culture_event_id
) approved_events
WHERE NOT EXISTS (
    SELECT 1 FROM event_approvals
    WHERE event_approvals.event_id = approved_events.event_id
      AND event_approvals.decision = 'approved'
);

INSERT INTO registrations (event_id, user_id, status)
VALUES
    (@ai_event_id, @attendee1_id, 'confirmed'),
    (@ai_event_id, @attendee2_id, 'confirmed'),
    (@ai_event_id, @attendee3_id, 'confirmed'),
    (@robot_event_id, @attendee2_id, 'confirmed'),
    (@robot_event_id, @attendee3_id, 'confirmed'),
    (@hackathon_event_id, @attendee1_id, 'confirmed'),
    (@hackathon_event_id, @attendee2_id, 'confirmed'),
    (@hackathon_event_id, @attendee4_id, 'waitlisted'),
    (@culture_event_id, @attendee1_id, 'confirmed'),
    (@culture_event_id, @attendee3_id, 'confirmed'),
    (@culture_event_id, @attendee4_id, 'confirmed')
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    cancelled_at = NULL;

SET @ai_reg_1 := (SELECT id FROM registrations WHERE event_id = @ai_event_id AND user_id = @attendee1_id LIMIT 1);
SET @ai_reg_2 := (SELECT id FROM registrations WHERE event_id = @ai_event_id AND user_id = @attendee2_id LIMIT 1);
SET @ai_reg_3 := (SELECT id FROM registrations WHERE event_id = @ai_event_id AND user_id = @attendee3_id LIMIT 1);
SET @robot_reg_2 := (SELECT id FROM registrations WHERE event_id = @robot_event_id AND user_id = @attendee2_id LIMIT 1);
SET @robot_reg_3 := (SELECT id FROM registrations WHERE event_id = @robot_event_id AND user_id = @attendee3_id LIMIT 1);
SET @hackathon_reg_1 := (SELECT id FROM registrations WHERE event_id = @hackathon_event_id AND user_id = @attendee1_id LIMIT 1);
SET @hackathon_reg_2 := (SELECT id FROM registrations WHERE event_id = @hackathon_event_id AND user_id = @attendee2_id LIMIT 1);
SET @culture_reg_1 := (SELECT id FROM registrations WHERE event_id = @culture_event_id AND user_id = @attendee1_id LIMIT 1);
SET @culture_reg_3 := (SELECT id FROM registrations WHERE event_id = @culture_event_id AND user_id = @attendee3_id LIMIT 1);
SET @culture_reg_4 := (SELECT id FROM registrations WHERE event_id = @culture_event_id AND user_id = @attendee4_id LIMIT 1);

INSERT INTO payments (registration_id, amount, status, mock_ref, paid_at)
VALUES
    (@ai_reg_1, 0.00, 'paid', CONCAT('DEMO-PAY-', @ai_reg_1), DATE_SUB(NOW(), INTERVAL 13 DAY)),
    (@ai_reg_2, 0.00, 'paid', CONCAT('DEMO-PAY-', @ai_reg_2), DATE_SUB(NOW(), INTERVAL 13 DAY)),
    (@ai_reg_3, 0.00, 'paid', CONCAT('DEMO-PAY-', @ai_reg_3), DATE_SUB(NOW(), INTERVAL 13 DAY)),
    (@robot_reg_2, 0.00, 'paid', CONCAT('DEMO-PAY-', @robot_reg_2), DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (@robot_reg_3, 0.00, 'paid', CONCAT('DEMO-PAY-', @robot_reg_3), DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (@hackathon_reg_1, 15.00, 'paid', CONCAT('DEMO-PAY-', @hackathon_reg_1), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (@hackathon_reg_2, 15.00, 'paid', CONCAT('DEMO-PAY-', @hackathon_reg_2), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (@culture_reg_1, 8.00, 'paid', CONCAT('DEMO-PAY-', @culture_reg_1), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (@culture_reg_3, 8.00, 'paid', CONCAT('DEMO-PAY-', @culture_reg_3), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (@culture_reg_4, 8.00, 'paid', CONCAT('DEMO-PAY-', @culture_reg_4), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE
    amount = VALUES(amount),
    status = VALUES(status),
    paid_at = VALUES(paid_at);

INSERT INTO tickets (registration_id, ticket_code, qr_token, status)
VALUES
    (@ai_reg_1, CONCAT('EO-DEMO-', @ai_reg_1), CONCAT('DEMO-TICKET-', @ai_reg_1), 'used'),
    (@ai_reg_2, CONCAT('EO-DEMO-', @ai_reg_2), CONCAT('DEMO-TICKET-', @ai_reg_2), 'used'),
    (@ai_reg_3, CONCAT('EO-DEMO-', @ai_reg_3), CONCAT('DEMO-TICKET-', @ai_reg_3), 'active'),
    (@robot_reg_2, CONCAT('EO-DEMO-', @robot_reg_2), CONCAT('DEMO-TICKET-', @robot_reg_2), 'used'),
    (@robot_reg_3, CONCAT('EO-DEMO-', @robot_reg_3), CONCAT('DEMO-TICKET-', @robot_reg_3), 'active'),
    (@hackathon_reg_1, CONCAT('EO-DEMO-', @hackathon_reg_1), CONCAT('DEMO-TICKET-', @hackathon_reg_1), 'active'),
    (@hackathon_reg_2, CONCAT('EO-DEMO-', @hackathon_reg_2), CONCAT('DEMO-TICKET-', @hackathon_reg_2), 'active'),
    (@culture_reg_1, CONCAT('EO-DEMO-', @culture_reg_1), CONCAT('DEMO-TICKET-', @culture_reg_1), 'active'),
    (@culture_reg_3, CONCAT('EO-DEMO-', @culture_reg_3), CONCAT('DEMO-TICKET-', @culture_reg_3), 'active'),
    (@culture_reg_4, CONCAT('EO-DEMO-', @culture_reg_4), CONCAT('DEMO-TICKET-', @culture_reg_4), 'active')
ON DUPLICATE KEY UPDATE
    status = VALUES(status);

SET @ai_ticket_1 := (SELECT id FROM tickets WHERE registration_id = @ai_reg_1 LIMIT 1);
SET @ai_ticket_2 := (SELECT id FROM tickets WHERE registration_id = @ai_reg_2 LIMIT 1);
SET @robot_ticket_2 := (SELECT id FROM tickets WHERE registration_id = @robot_reg_2 LIMIT 1);

INSERT INTO check_ins (ticket_id, checked_by, method, checked_at)
VALUES
    (@ai_ticket_1, @computing_org_id, 'qr_scan', DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 30 MINUTE),
    (@ai_ticket_2, @computing_org_id, 'manual_entry', DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 45 MINUTE),
    (@robot_ticket_2, @robotics_org_id, 'qr_scan', DATE_SUB(NOW(), INTERVAL 18 DAY) + INTERVAL 40 MINUTE)
ON DUPLICATE KEY UPDATE
    checked_by = VALUES(checked_by),
    method = VALUES(method),
    checked_at = VALUES(checked_at);

INSERT INTO feedback (event_id, user_id, rating, comment)
VALUES
    (@ai_event_id, @attendee1_id, 5, 'Hands-on tasks were clear and useful. The mentors were very helpful.'),
    (@ai_event_id, @attendee2_id, 4, 'Good workshop flow. More time for Q&A would make it even better.'),
    (@robot_event_id, @attendee2_id, 5, 'The robot challenge was exciting and well organised.')
ON DUPLICATE KEY UPDATE
    rating = VALUES(rating),
    comment = VALUES(comment);

INSERT INTO certificates (registration_id, certificate_code)
VALUES
    (@ai_reg_1, CONCAT('CERT-DEMO-', @ai_reg_1)),
    (@ai_reg_2, CONCAT('CERT-DEMO-', @ai_reg_2)),
    (@robot_reg_2, CONCAT('CERT-DEMO-', @robot_reg_2))
ON DUPLICATE KEY UPDATE
    certificate_code = VALUES(certificate_code);

SELECT
    'Complete multi-society demo data ready' AS status,
    'admin@example.com / password123' AS admin_login,
    'computing.organiser@example.com / password123' AS computing_organiser_login,
    'robotics.organiser@example.com / password123' AS robotics_organiser_login,
    'culture.organiser@example.com / password123' AS culture_organiser_login,
    'attendee1@example.com / password123' AS attendee_login;
