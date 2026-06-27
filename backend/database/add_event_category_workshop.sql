USE eventora;

ALTER TABLE events
  MODIFY category ENUM('academic', 'sports', 'cultural', 'religious', 'workshop') NOT NULL;
