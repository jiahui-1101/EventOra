USE eventora;

-- One-time bootstrap account for the first Faculty Admin.
-- Email: admin@example.com
-- Password: password123
--
-- Change this password immediately after deployment if the app is used
-- outside a local demo environment.
INSERT INTO users (name, email, password_hash, role)
VALUES (
    'Faculty Admin',
    'admin@example.com',
    '$2y$10$dOyOATeG2/yHy.yrmonwT.LSLv5tmvmDAeCfdpIHqcIXmfbwQqmqi',
    'faculty_admin'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password_hash = VALUES(password_hash),
    role = 'faculty_admin';
