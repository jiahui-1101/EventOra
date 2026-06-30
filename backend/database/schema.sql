-- EventOra Database Schema
-- Generated to match PR1 Data Dictionary exactly (Section 7.1)
-- Includes core PR1 tables plus deploy-ready organiser requests,
-- feedback, and certificates. Notifications remain in create_notifications.sql.

CREATE DATABASE IF NOT EXISTS eventora
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE eventora;

-- ============================================
-- 1. users
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('attendee', 'organiser', 'faculty_admin') NOT NULL,
    matric_no VARCHAR(20) NULL,
    phone VARCHAR(20) NULL,
    avatar_url VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 2. societies
-- ============================================
CREATE TABLE societies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    logo_url VARCHAR(255) NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_societies_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================
-- 3. society_members
-- ============================================
CREATE TABLE society_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('organiser', 'co_organiser') NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_society_members_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_society_members_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    -- Same user shouldn't be added to the same society twice
    UNIQUE KEY uq_society_user (society_id, user_id)
) ENGINE=InnoDB;

-- ============================================
-- 4. organiser_society_requests
-- ============================================
CREATE TABLE organiser_society_requests (
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

-- ============================================
-- 5. events
-- ============================================
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    created_by INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    venue VARCHAR(200) NOT NULL,
    category ENUM('academic', 'sports', 'cultural', 'religious', 'workshop') NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    reg_deadline DATETIME NOT NULL,
    capacity INT NOT NULL,
    fee_type ENUM('free', 'paid') NOT NULL,
    fee_amount DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    waitlist_enabled TINYINT(1) NOT NULL DEFAULT 1,
    poster_url VARCHAR(255) NULL,
    contact_person VARCHAR(100) NULL,
    contact_email VARCHAR(150) NULL,
    special_instructions TEXT NULL,
    status ENUM('draft', 'pending_approval', 'published', 'completed', 'rejected', 'cancelled') NOT NULL DEFAULT 'draft',
    cancellation_reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_events_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT,

    -- These fields get filtered/searched constantly on the public listing page,
    -- so indexing them keeps that query fast as event count grows
    INDEX idx_events_status (status),
    INDEX idx_events_category (category),
    INDEX idx_events_society (society_id)
) ENGINE=InnoDB;

-- ============================================
-- 6. event_approvals
-- ============================================
CREATE TABLE event_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    reviewed_by INT NOT NULL,
    decision ENUM('approved', 'rejected') NOT NULL,
    reason TEXT NULL,
    reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_approvals_event
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_approvals_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================
-- 7. favorites
-- ============================================
CREATE TABLE favorites (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_favorites_user_event (user_id, event_id),

    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_favorites_event
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE CASCADE,

    INDEX idx_favorites_user (user_id)
) ENGINE=InnoDB;

-- ============================================
-- 8. registrations
-- ============================================
CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending_payment', 'confirmed', 'waitlisted', 'cancelled') NOT NULL DEFAULT 'pending_payment',
    waitlist_position INT NULL,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,

    CONSTRAINT fk_registrations_event
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_registrations_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    -- Keeps one current registration record per attendee/event; the service
    -- reuses cancelled rows when a user registers again.
    UNIQUE KEY uq_event_user (event_id, user_id),

    INDEX idx_registrations_status (status)
) ENGINE=InnoDB;

-- ============================================
-- 8. payments
-- ============================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL UNIQUE,
    amount DECIMAL(8,2) NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded_mock') NOT NULL DEFAULT 'pending',
    mock_ref VARCHAR(50) NOT NULL UNIQUE,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- registration_id is UNIQUE above, which is what makes this a true 1:1
    -- relationship as specified in PR1 ("References registrations.id; one-to-one")
    CONSTRAINT fk_payments_registration
        FOREIGN KEY (registration_id) REFERENCES registrations(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 9. tickets
-- ============================================
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL UNIQUE,
    ticket_code VARCHAR(24) NOT NULL UNIQUE,
    qr_token VARCHAR(64) NOT NULL UNIQUE,
    status ENUM('active', 'used', 'cancelled') NOT NULL DEFAULT 'active',
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 1:1 with registrations, same pattern as payments above
    CONSTRAINT fk_tickets_registration
        FOREIGN KEY (registration_id) REFERENCES registrations(id)
        ON DELETE CASCADE,

    -- qr_token is looked up on every QR scan during check-in, must be fast
    INDEX idx_tickets_qr_token (qr_token)
) ENGINE=InnoDB;

-- ============================================
-- 10. check_ins
-- ============================================
CREATE TABLE check_ins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL UNIQUE,
    checked_by INT NOT NULL,
    method ENUM('qr_scan', 'manual_entry') NOT NULL,
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- ticket_id is UNIQUE, which enforces "prevents double check-in"
    -- exactly as stated in PR1's description of this entity
    CONSTRAINT fk_checkins_ticket
        FOREIGN KEY (ticket_id) REFERENCES tickets(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_checkins_checker
        FOREIGN KEY (checked_by) REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================
-- 11. feedback
-- ============================================
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_event
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5),
    UNIQUE KEY uq_feedback_event_user (event_id, user_id),
    INDEX idx_feedback_event (event_id)
) ENGINE=InnoDB;

-- ============================================
-- 12. certificates
-- ============================================
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL UNIQUE,
    certificate_code VARCHAR(40) NOT NULL UNIQUE,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_certificates_registration
        FOREIGN KEY (registration_id) REFERENCES registrations(id)
        ON DELETE CASCADE,

    INDEX idx_certificates_code (certificate_code)
) ENGINE=InnoDB;
