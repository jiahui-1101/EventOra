USE eventora;

CREATE TABLE IF NOT EXISTS organiser_society_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    society_name VARCHAR(100) NOT NULL,
    society_description TEXT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by INT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,

    CONSTRAINT fk_organiser_requests_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_organiser_requests_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
        ON DELETE SET NULL,

    UNIQUE KEY uq_organiser_society_request (user_id, society_name),
    INDEX idx_organiser_requests_status (status)
) ENGINE=InnoDB;
