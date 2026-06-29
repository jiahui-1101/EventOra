USE eventora;

ALTER TABLE tickets
  ADD COLUMN ticket_code VARCHAR(24) NULL AFTER registration_id;

UPDATE tickets
SET ticket_code = CONCAT('EO-', LPAD(id, 8, '0'))
WHERE ticket_code IS NULL;

ALTER TABLE tickets
  MODIFY ticket_code VARCHAR(24) NOT NULL,
  ADD UNIQUE KEY uq_tickets_ticket_code (ticket_code);
