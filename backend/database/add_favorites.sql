-- Command:
--   Get-Content -Raw database\add_favorites.sql | & "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe" -u root eventora

CREATE TABLE IF NOT EXISTS favorites (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    event_id    INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- One user can only favorite the same event once
    UNIQUE KEY uq_favorites_user_event (user_id, event_id),

    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_favorites_event
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE CASCADE,

    INDEX idx_favorites_user (user_id)
) ENGINE=InnoDB;
