USE eventora;

SET @demo_password_hash := '$2y$10$dOyOATeG2/yHy.yrmonwT.LSLv5tmvmDAeCfdpIHqcIXmfbwQqmqi';

INSERT IGNORE INTO users (name, email, password_hash, role, matric_no, phone)
VALUES ('Zara Izzati', 'attendee5@example.com', @demo_password_hash, 'attendee', 'A23CS0014', '+60 12-000 3005');

SET @admin_id            := (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1);
SET @computing_org_id    := (SELECT id FROM users WHERE email = 'computing.organiser@example.com' LIMIT 1);
SET @robotics_org_id     := (SELECT id FROM users WHERE email = 'robotics.organiser@example.com' LIMIT 1);
SET @culture_org_id      := (SELECT id FROM users WHERE email = 'culture.organiser@example.com' LIMIT 1);

SET @att1                := (SELECT id FROM users WHERE email = 'attendee1@example.com' LIMIT 1);
SET @att2                := (SELECT id FROM users WHERE email = 'attendee2@example.com' LIMIT 1);
SET @att3                := (SELECT id FROM users WHERE email = 'attendee3@example.com' LIMIT 1);
SET @att4                := (SELECT id FROM users WHERE email = 'attendee4@example.com' LIMIT 1);
SET @att5                := (SELECT id FROM users WHERE email = 'attendee5@example.com' LIMIT 1);

SET @soc_comp := (SELECT id FROM societies WHERE name = 'Computing Society' LIMIT 1);
SET @soc_robo := (SELECT id FROM societies WHERE name = 'Robotics Club' LIMIT 1);
SET @soc_cult := (SELECT id FROM societies WHERE name = 'Cultural Arts Club' LIMIT 1);

INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_comp, @computing_org_id, 'Web Dev Workshop: Vue & Tailwind', 'Full-day workshop covering Vue 3 and Tailwind CSS.', 'N28A Computer Lab', 'workshop', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 6 HOUR, DATE_ADD(NOW(), INTERVAL 4 DAY), 50, 'free', 0.00, 1, 'Aiman Hakim', 'computing.society@utm.my', 'Bring laptop.', 'published'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Web Dev Workshop: Vue & Tailwind');

INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_comp, @computing_org_id, 'Tech Career Fair 2026', 'Connect with 20+ tech companies for graduate placement.', 'Dewan Seminar N28', 'academic', DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY) + INTERVAL 5 HOUR, DATE_ADD(NOW(), INTERVAL 25 DAY), 200, 'paid', 5.00, 1, 'Siti Noor', 'computing.society@utm.my', 'Dress professionally.', 'published'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Tech Career Fair 2026');

INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_robo, @robotics_org_id, 'Embedded Systems with Raspberry Pi', 'Hands-on intro to Raspberry Pi GPIO programming.', 'P19 Robotics Lab', 'workshop', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 3 HOUR, DATE_ADD(NOW(), INTERVAL 3 DAY), 30, 'free', 0.00, 1, 'Razif Johan', 'robotics@utm.my', 'Kits provided.', 'published'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Embedded Systems with Raspberry Pi');

INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_robo, @robotics_org_id, 'UTM Robot Soccer League', 'Inter-faculty robot soccer competition.', 'Sports Complex Arena', 'sports', DATE_ADD(NOW(), INTERVAL 45 DAY), DATE_ADD(NOW(), INTERVAL 45 DAY) + INTERVAL 6 HOUR, DATE_ADD(NOW(), INTERVAL 38 DAY), 60, 'paid', 20.00, 1, 'Hana Lee', 'drone.safety@utm.my', 'Submit specs.', 'published'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'UTM Robot Soccer League');

INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_cult, @culture_org_id, 'Hari Raya Open House 2026', 'Traditional food, games, and Hari Raya photo booth.', 'Dewan Sultan Iskandar Foyer', 'cultural', DATE_ADD(NOW(), INTERVAL 12 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY) + INTERVAL 4 HOUR, DATE_ADD(NOW(), INTERVAL 9 DAY), 250, 'free', 0.00, 1, 'Mei Lin', 'culture@utm.my', 'All welcome.', 'published'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Hari Raya Open House 2026');

INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_cult, @culture_org_id, 'Campus Photography Workshop', 'Learn composition and lighting from a pro photographer.', 'Cultural Arts Centre Studio', 'cultural', DATE_ADD(NOW(), INTERVAL 22 DAY), DATE_ADD(NOW(), INTERVAL 22 DAY) + INTERVAL 5 HOUR, DATE_ADD(NOW(), INTERVAL 18 DAY), 25, 'paid', 12.00, 1, 'Mei Lin', 'culture@utm.my', 'Bring camera.', 'published'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Campus Photography Workshop');


INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_comp, @computing_org_id, 'Python for Data Science Bootcamp', 'Two-day intensive covering pandas and scikit-learn.', 'N28A Computer Lab', 'workshop', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 29 DAY), DATE_SUB(NOW(), INTERVAL 33 DAY), 45, 'free', 0.00, 1, 'Siti Noor', 'computing.society@utm.my', 'Bring laptop.', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Python for Data Science Bootcamp');

INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_robo, @robotics_org_id, 'IoT Smart Campus Showcase', 'Student teams demonstrate IoT projects built for campus.', 'Faculty of Computing Atrium', 'academic', DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 21 DAY) + INTERVAL 3 HOUR, DATE_SUB(NOW(), INTERVAL 24 DAY), 80, 'free', 0.00, 1, 'Razif Johan', 'robotics@utm.my', NULL, 'completed'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'IoT Smart Campus Showcase');

INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_cult, @culture_org_id, 'Warisan: Traditional Dance Night', 'An evening celebrating Malaysian traditional dance.', 'Dewan Sultan Iskandar', 'cultural', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY) + INTERVAL 3 HOUR, DATE_SUB(NOW(), INTERVAL 17 DAY), 120, 'paid', 10.00, 1, 'Mei Lin', 'culture@utm.my', 'Smart casual.', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Warisan: Traditional Dance Night');

INSERT INTO events (society_id, created_by, title, description, venue, category, start_datetime, end_datetime, reg_deadline, capacity, fee_type, fee_amount, waitlist_enabled, contact_person, contact_email, special_instructions, status)
SELECT @soc_comp, @computing_org_id, 'Capture The Flag: Cybersecurity Challenge', 'A beginner-to-intermediate CTF competition.', 'N28A Innovation Lab', 'academic', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 5 HOUR, DATE_SUB(NOW(), INTERVAL 10 DAY), 60, 'paid', 10.00, 1, 'Aiman Hakim', 'hackathon@utm.my', 'Teams of 2 to 3.', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Capture The Flag: Cybersecurity Challenge');


SET @ev_py  := (SELECT id FROM events WHERE title = 'Python for Data Science Bootcamp' LIMIT 1);
SET @ev_iot := (SELECT id FROM events WHERE title = 'IoT Smart Campus Showcase' LIMIT 1);
SET @ev_dan := (SELECT id FROM events WHERE title = 'Warisan: Traditional Dance Night' LIMIT 1);
SET @ev_ctf := (SELECT id FROM events WHERE title = 'Capture The Flag: Cybersecurity Challenge' LIMIT 1);
SET @ev_w1  := (SELECT id FROM events WHERE title = 'Web Dev Workshop: Vue & Tailwind' LIMIT 1);
SET @ev_w2  := (SELECT id FROM events WHERE title = 'Tech Career Fair 2026' LIMIT 1);
SET @ev_w3  := (SELECT id FROM events WHERE title = 'Embedded Systems with Raspberry Pi' LIMIT 1);
SET @ev_w4  := (SELECT id FROM events WHERE title = 'UTM Robot Soccer League' LIMIT 1);
SET @ev_w5  := (SELECT id FROM events WHERE title = 'Hari Raya Open House 2026' LIMIT 1);
SET @ev_w6  := (SELECT id FROM events WHERE title = 'Campus Photography Workshop' LIMIT 1);

INSERT IGNORE INTO event_approvals (event_id, reviewed_by, decision, reason)
VALUES 
(@ev_py, @admin_id, 'approved', NULL), (@ev_iot, @admin_id, 'approved', NULL), (@ev_dan, @admin_id, 'approved', NULL), (@ev_ctf, @admin_id, 'approved', NULL),
(@ev_w1, @admin_id, 'approved', NULL), (@ev_w2, @admin_id, 'approved', NULL), (@ev_w3, @admin_id, 'approved', NULL), (@ev_w4, @admin_id, 'approved', NULL), (@ev_w5, @admin_id, 'approved', NULL), (@ev_w6, @admin_id, 'approved', NULL);


INSERT IGNORE INTO registrations (event_id, user_id, status) VALUES
(@ev_py, @att1, 'confirmed'), (@ev_py, @att2, 'confirmed'), (@ev_py, @att3, 'confirmed'), (@ev_py, @att4, 'confirmed'), (@ev_py, @att5, 'confirmed'),
(@ev_iot, @att1, 'confirmed'), (@ev_iot, @att2, 'confirmed'), (@ev_iot, @att3, 'confirmed'), (@ev_iot, @att4, 'confirmed'), (@ev_iot, @att5, 'confirmed'),
(@ev_dan, @att1, 'confirmed'), (@ev_dan, @att2, 'confirmed'), (@ev_dan, @att3, 'confirmed'), (@ev_dan, @att4, 'confirmed'), (@ev_dan, @att5, 'confirmed'),
(@ev_ctf, @att1, 'confirmed'), (@ev_ctf, @att2, 'confirmed'), (@ev_ctf, @att3, 'confirmed'), (@ev_ctf, @att4, 'confirmed'), (@ev_ctf, @att5, 'confirmed');


SET @r_py1 := (SELECT id FROM registrations WHERE event_id=@ev_py AND user_id=@att1 LIMIT 1);
SET @r_py2 := (SELECT id FROM registrations WHERE event_id=@ev_py AND user_id=@att2 LIMIT 1);
SET @r_py3 := (SELECT id FROM registrations WHERE event_id=@ev_py AND user_id=@att3 LIMIT 1);
SET @r_py4 := (SELECT id FROM registrations WHERE event_id=@ev_py AND user_id=@att4 LIMIT 1);
SET @r_py5 := (SELECT id FROM registrations WHERE event_id=@ev_py AND user_id=@att5 LIMIT 1);

SET @r_iot1 := (SELECT id FROM registrations WHERE event_id=@ev_iot AND user_id=@att1 LIMIT 1);
SET @r_iot2 := (SELECT id FROM registrations WHERE event_id=@ev_iot AND user_id=@att2 LIMIT 1);
SET @r_iot3 := (SELECT id FROM registrations WHERE event_id=@ev_iot AND user_id=@att3 LIMIT 1);
SET @r_iot4 := (SELECT id FROM registrations WHERE event_id=@ev_iot AND user_id=@att4 LIMIT 1);
SET @r_iot5 := (SELECT id FROM registrations WHERE event_id=@ev_iot AND user_id=@att5 LIMIT 1);

SET @r_dan1 := (SELECT id FROM registrations WHERE event_id=@ev_dan AND user_id=@att1 LIMIT 1);
SET @r_dan2 := (SELECT id FROM registrations WHERE event_id=@ev_dan AND user_id=@att2 LIMIT 1);
SET @r_dan3 := (SELECT id FROM registrations WHERE event_id=@ev_dan AND user_id=@att3 LIMIT 1);
SET @r_dan4 := (SELECT id FROM registrations WHERE event_id=@ev_dan AND user_id=@att4 LIMIT 1);
SET @r_dan5 := (SELECT id FROM registrations WHERE event_id=@ev_dan AND user_id=@att5 LIMIT 1);

SET @r_ctf1 := (SELECT id FROM registrations WHERE event_id=@ev_ctf AND user_id=@att1 LIMIT 1);
SET @r_ctf2 := (SELECT id FROM registrations WHERE event_id=@ev_ctf AND user_id=@att2 LIMIT 1);
SET @r_ctf3 := (SELECT id FROM registrations WHERE event_id=@ev_ctf AND user_id=@att3 LIMIT 1);
SET @r_ctf4 := (SELECT id FROM registrations WHERE event_id=@ev_ctf AND user_id=@att4 LIMIT 1);
SET @r_ctf5 := (SELECT id FROM registrations WHERE event_id=@ev_ctf AND user_id=@att5 LIMIT 1);

INSERT IGNORE INTO payments (registration_id, amount, status, mock_ref, paid_at) VALUES
(@r_py1, 0, 'paid', CONCAT('PAY-',@r_py1), NOW()), (@r_py2, 0, 'paid', CONCAT('PAY-',@r_py2), NOW()), (@r_py3, 0, 'paid', CONCAT('PAY-',@r_py3), NOW()), (@r_py4, 0, 'paid', CONCAT('PAY-',@r_py4), NOW()), (@r_py5, 0, 'paid', CONCAT('PAY-',@r_py5), NOW()),
(@r_iot1, 0, 'paid', CONCAT('PAY-',@r_iot1), NOW()), (@r_iot2, 0, 'paid', CONCAT('PAY-',@r_iot2), NOW()), (@r_iot3, 0, 'paid', CONCAT('PAY-',@r_iot3), NOW()), (@r_iot4, 0, 'paid', CONCAT('PAY-',@r_iot4), NOW()), (@r_iot5, 0, 'paid', CONCAT('PAY-',@r_iot5), NOW()),
(@r_dan1, 10, 'paid', CONCAT('PAY-',@r_dan1), NOW()), (@r_dan2, 10, 'paid', CONCAT('PAY-',@r_dan2), NOW()), (@r_dan3, 10, 'paid', CONCAT('PAY-',@r_dan3), NOW()), (@r_dan4, 10, 'paid', CONCAT('PAY-',@r_dan4), NOW()), (@r_dan5, 10, 'paid', CONCAT('PAY-',@r_dan5), NOW()),
(@r_ctf1, 10, 'paid', CONCAT('PAY-',@r_ctf1), NOW()), (@r_ctf2, 10, 'paid', CONCAT('PAY-',@r_ctf2), NOW()), (@r_ctf3, 10, 'paid', CONCAT('PAY-',@r_ctf3), NOW()), (@r_ctf4, 10, 'paid', CONCAT('PAY-',@r_ctf4), NOW()), (@r_ctf5, 10, 'paid', CONCAT('PAY-',@r_ctf5), NOW());


INSERT IGNORE INTO tickets (registration_id, ticket_code, qr_token, status) VALUES
(@r_py1, CONCAT('EO-FINAL-',@r_py1), CONCAT('DEMO-TKT-',@r_py1), 'used'), (@r_py2, CONCAT('EO-FINAL-',@r_py2), CONCAT('DEMO-TKT-',@r_py2), 'used'), (@r_py3, CONCAT('EO-FINAL-',@r_py3), CONCAT('DEMO-TKT-',@r_py3), 'used'), (@r_py4, CONCAT('EO-FINAL-',@r_py4), CONCAT('DEMO-TKT-',@r_py4), 'used'), (@r_py5, CONCAT('EO-FINAL-',@r_py5), CONCAT('DEMO-TKT-',@r_py5), 'used'),
(@r_iot1, CONCAT('EO-FINAL-',@r_iot1), CONCAT('DEMO-TKT-',@r_iot1), 'used'), (@r_iot2, CONCAT('EO-FINAL-',@r_iot2), CONCAT('DEMO-TKT-',@r_iot2), 'used'), (@r_iot3, CONCAT('EO-FINAL-',@r_iot3), CONCAT('DEMO-TKT-',@r_iot3), 'used'), 
(@r_iot4, CONCAT('EO-FINAL-',@r_iot4), CONCAT('DEMO-TKT-',@r_iot4), 'active'), (@r_iot5, CONCAT('EO-FINAL-',@r_iot5), CONCAT('DEMO-TKT-',@r_iot5), 'active'), -- 【防呆伏笔】门票有效，但人没去
(@r_dan1, CONCAT('EO-FINAL-',@r_dan1), CONCAT('DEMO-TKT-',@r_dan1), 'used'), (@r_dan2, CONCAT('EO-FINAL-',@r_dan2), CONCAT('DEMO-TKT-',@r_dan2), 'used'), (@r_dan3, CONCAT('EO-FINAL-',@r_dan3), CONCAT('DEMO-TKT-',@r_dan3), 'used'), (@r_dan4, CONCAT('EO-FINAL-',@r_dan4), CONCAT('DEMO-TKT-',@r_dan4), 'used'), (@r_dan5, CONCAT('EO-FINAL-',@r_dan5), CONCAT('DEMO-TKT-',@r_dan5), 'used'),
(@r_ctf1, CONCAT('EO-FINAL-',@r_ctf1), CONCAT('DEMO-TKT-',@r_ctf1), 'used'), (@r_ctf2, CONCAT('EO-FINAL-',@r_ctf2), CONCAT('DEMO-TKT-',@r_ctf2), 'used'), (@r_ctf3, CONCAT('EO-FINAL-',@r_ctf3), CONCAT('DEMO-TKT-',@r_ctf3), 'used'), (@r_ctf4, CONCAT('EO-FINAL-',@r_ctf4), CONCAT('DEMO-TKT-',@r_ctf4), 'used'), (@r_ctf5, CONCAT('EO-FINAL-',@r_ctf5), CONCAT('DEMO-TKT-',@r_ctf5), 'used');


SET @t_py1 := (SELECT id FROM tickets WHERE registration_id=@r_py1 LIMIT 1); SET @t_py2 := (SELECT id FROM tickets WHERE registration_id=@r_py2 LIMIT 1); SET @t_py3 := (SELECT id FROM tickets WHERE registration_id=@r_py3 LIMIT 1); SET @t_py4 := (SELECT id FROM tickets WHERE registration_id=@r_py4 LIMIT 1); SET @t_py5 := (SELECT id FROM tickets WHERE registration_id=@r_py5 LIMIT 1);
SET @t_iot1 := (SELECT id FROM tickets WHERE registration_id=@r_iot1 LIMIT 1); SET @t_iot2 := (SELECT id FROM tickets WHERE registration_id=@r_iot2 LIMIT 1); SET @t_iot3 := (SELECT id FROM tickets WHERE registration_id=@r_iot3 LIMIT 1);
SET @t_dan1 := (SELECT id FROM tickets WHERE registration_id=@r_dan1 LIMIT 1); SET @t_dan2 := (SELECT id FROM tickets WHERE registration_id=@r_dan2 LIMIT 1); SET @t_dan3 := (SELECT id FROM tickets WHERE registration_id=@r_dan3 LIMIT 1); SET @t_dan4 := (SELECT id FROM tickets WHERE registration_id=@r_dan4 LIMIT 1); SET @t_dan5 := (SELECT id FROM tickets WHERE registration_id=@r_dan5 LIMIT 1);
SET @t_ctf1 := (SELECT id FROM tickets WHERE registration_id=@r_ctf1 LIMIT 1); SET @t_ctf2 := (SELECT id FROM tickets WHERE registration_id=@r_ctf2 LIMIT 1); SET @t_ctf3 := (SELECT id FROM tickets WHERE registration_id=@r_ctf3 LIMIT 1); SET @t_ctf4 := (SELECT id FROM tickets WHERE registration_id=@r_ctf4 LIMIT 1); SET @t_ctf5 := (SELECT id FROM tickets WHERE registration_id=@r_ctf5 LIMIT 1);

INSERT IGNORE INTO check_ins (ticket_id, checked_by, method, checked_at) VALUES
(@t_py1, @computing_org_id, 'qr_scan', NOW()), (@t_py2, @computing_org_id, 'qr_scan', NOW()), (@t_py3, @computing_org_id, 'manual_entry', NOW()), (@t_py4, @computing_org_id, 'qr_scan', NOW()), (@t_py5, @computing_org_id, 'qr_scan', NOW()),
(@t_iot1, @robotics_org_id, 'qr_scan', NOW()), (@t_iot2, @robotics_org_id, 'qr_scan', NOW()), (@t_iot3, @robotics_org_id, 'manual_entry', NOW()),

(@t_dan1, @culture_org_id, 'qr_scan', NOW()), (@t_dan2, @culture_org_id, 'qr_scan', NOW()), (@t_dan3, @culture_org_id, 'manual_entry', NOW()), (@t_dan4, @culture_org_id, 'qr_scan', NOW()), (@t_dan5, @culture_org_id, 'qr_scan', NOW()),
(@t_ctf1, @computing_org_id, 'qr_scan', NOW()), (@t_ctf2, @computing_org_id, 'qr_scan', NOW()), (@t_ctf3, @computing_org_id, 'manual_entry', NOW()), (@t_ctf4, @computing_org_id, 'qr_scan', NOW()), (@t_ctf5, @computing_org_id, 'manual_entry', NOW());


INSERT IGNORE INTO feedback (event_id, user_id, rating, comment) VALUES
(@ev_py, @att1, 5, 'Best workshop I have attended this semester.'), (@ev_py, @att2, 4, 'Solid content.'), (@ev_py, @att3, 5, 'Really appreciated the thorough Q&A.'),
(@ev_iot, @att1, 5, 'Impressive smart locker UX.'), (@ev_iot, @att2, 4, 'Enjoyed seeing real student work.'), (@ev_iot, @att3, 4, 'Occupancy sensor demo was great.'),
(@ev_dan, @att1, 5, 'Absolutely beautiful performances.'), (@ev_dan, @att2, 4, 'Acoustics could be better but amazing dancers.'), (@ev_dan, @att3, 5, 'Make this an annual thing!'),
(@ev_ctf, @att1, 5, 'Perfectly balanced puzzles.'), (@ev_ctf, @att2, 5, 'Hints system was fair.'), (@ev_ctf, @att3, 4, 'More beginner web challenges please.');


INSERT IGNORE INTO certificates (registration_id, certificate_code)
SELECT r.id, CONCAT('CERT-', LPAD(r.id, 6, '0'))
FROM registrations r
JOIN tickets t ON t.registration_id = r.id
JOIN check_ins ci ON ci.ticket_id = t.id;


SELECT 
    u.email, 
    SUBSTRING(e.title, 1, 22) AS event_title, 
    IF(ci.id IS NOT NULL, '✅ Checked In', '❌ MISSED (Pigeon)') AS check_in_status,
    IF(f.id  IS NOT NULL, '⭐️ Reviewed', '✍️ PENDING (Typing stage)') AS review_status
FROM users u 
JOIN registrations r ON r.user_id = u.id 
JOIN events e ON e.id = r.event_id 
LEFT JOIN tickets t ON t.registration_id = r.id 
LEFT JOIN check_ins ci ON ci.ticket_id = t.id 
LEFT JOIN feedback f ON f.event_id = e.id AND f.user_id = u.id
WHERE u.email IN ('attendee4@example.com', 'attendee5@example.com') AND e.status = 'completed'
ORDER BY u.email, e.title;
