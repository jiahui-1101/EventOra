<?php

declare(strict_types=1);

namespace App\Services;

use PDO;
use PDOException;

class TicketingService
{
    public function createRegistration(PDO $db, int $eventId, int $userId): array
    {
        $event = $this->findPublicEvent($db, $eventId);
        if ($event === null) {
            return $this->result(false, 'EVENT_NOT_FOUND', 'Event not found', 404);
        }

        $stateError = $this->validateEventCanRegister($event);
        if ($stateError !== null) {
            return $stateError;
        }

        $existing = $this->findActiveRegistration($db, $eventId, $userId);
        if ($existing !== null) {
            return $this->result(false, 'DUPLICATE_REGISTRATION', 'You are already registered for this event', 409);
        }

        try {
            $db->beginTransaction();

            $occupiedCount = $this->countOccupiedSeats($db, $eventId);
            $hasSeat = $occupiedCount < (int) $event['capacity'];

            if (!$hasSeat && !(bool) $event['waitlist_enabled']) {
                $db->rollBack();
                return $this->result(false, 'EVENT_FULL', 'This event is full and waitlist is not available', 409);
            }

            $status = $hasSeat
                ? (((float) $event['fee_amount'] > 0.0 || $event['fee_type'] === 'paid') ? 'pending_payment' : 'confirmed')
                : 'waitlisted';
            $waitlistPosition = $status === 'waitlisted' ? $this->nextWaitlistPosition($db, $eventId) : null;

            $reusableRegistration = $this->findCancelledRegistration($db, $eventId, $userId);
            if ($reusableRegistration !== null) {
                $registrationId = (int) $reusableRegistration['id'];
                $this->clearRegistrationArtifacts($db, $registrationId);

                $stmt = $db->prepare(
                    "UPDATE registrations
                     SET status = :status,
                         waitlist_position = :waitlist_position,
                         registered_at = NOW(),
                         cancelled_at = NULL
                     WHERE id = :id AND user_id = :user_id"
                );
                $stmt->execute([
                    'status' => $status,
                    'waitlist_position' => $waitlistPosition,
                    'id' => $registrationId,
                    'user_id' => $userId,
                ]);
            } else {
                $stmt = $db->prepare(
                    'INSERT INTO registrations (event_id, user_id, status, waitlist_position)
                     VALUES (:event_id, :user_id, :status, :waitlist_position)'
                );
                $stmt->execute([
                    'event_id' => $eventId,
                    'user_id' => $userId,
                    'status' => $status,
                    'waitlist_position' => $waitlistPosition,
                ]);

                $registrationId = (int) $db->lastInsertId();
            }
            $payment = null;
            $ticket = null;

            if ($status === 'pending_payment') {
                $payment = $this->createPayment($db, $registrationId, (float) $event['fee_amount']);
            }

            if ($status === 'confirmed') {
                $ticket = $this->createTicket($db, $registrationId);
            }

            $registration = $this->findRegistrationById($db, $registrationId, $userId);
            NotificationService::create(
                $userId,
                $status === 'waitlisted' ? 'waitlist' : ($status === 'pending_payment' ? 'payment' : 'registration'),
                $status === 'waitlisted' ? 'Waitlist joined' : ($status === 'pending_payment' ? 'Payment pending' : 'Registration confirmed'),
                $this->registrationMessage($event['title'], $status, $waitlistPosition),
                $eventId
            );

            $db->commit();

            return $this->result(true, null, null, 201, [
                'registration' => $this->formatRegistration($registration),
                'payment' => $payment,
                'ticket' => $ticket,
            ]);
        } catch (PDOException $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }

            if ($e->getCode() === '23000') {
                return $this->result(false, 'DUPLICATE_REGISTRATION', 'You are already registered for this event', 409);
            }

            return $this->result(false, 'DB_ERROR', 'Could not register for this event', 500);
        }
    }

    public function confirmPayment(PDO $db, int $registrationId, int $userId): array
    {
        $registration = $this->findRegistrationById($db, $registrationId, $userId);
        if ($registration === null) {
            return $this->result(false, 'REGISTRATION_NOT_FOUND', 'Registration not found', 404);
        }
        if ($registration['status'] !== 'pending_payment') {
            return $this->result(false, 'INVALID_STATE', 'Only pending payments can be confirmed', 400);
        }

        try {
            $db->beginTransaction();

            $paymentStmt = $db->prepare(
                "UPDATE payments
                 SET status = 'paid', paid_at = NOW()
                 WHERE registration_id = :registration_id"
            );
            $paymentStmt->execute(['registration_id' => $registrationId]);

            $regStmt = $db->prepare(
                "UPDATE registrations
                 SET status = 'confirmed', waitlist_position = NULL
                 WHERE id = :id AND user_id = :user_id"
            );
            $regStmt->execute(['id' => $registrationId, 'user_id' => $userId]);

            $ticket = $this->createTicket($db, $registrationId);
            $updatedRegistration = $this->findRegistrationById($db, $registrationId, $userId);

            NotificationService::create(
                $userId,
                'payment',
                'Payment confirmed',
                "Your payment for '{$registration['event_title']}' was confirmed. Your QR ticket is ready.",
                (int) $registration['event_id']
            );

            $db->commit();

            return $this->result(true, null, null, 200, [
                'registration' => $this->formatRegistration($updatedRegistration),
                'ticket' => $ticket,
            ]);
        } catch (PDOException) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }

            return $this->result(false, 'DB_ERROR', 'Could not confirm payment', 500);
        }
    }

    public function listRegistrations(PDO $db, int $userId): array
    {
        $stmt = $db->prepare(
            'SELECT r.*, e.title AS event_title, e.venue, e.start_datetime, e.end_datetime,
                    e.status AS event_status, e.fee_type, e.fee_amount, s.name AS society_name,
                    t.id AS ticket_id, t.ticket_code, t.qr_token, t.status AS ticket_status,
                    ci.checked_at
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             JOIN societies s ON s.id = e.society_id
             LEFT JOIN tickets t ON t.registration_id = r.id
             LEFT JOIN check_ins ci ON ci.ticket_id = t.id
             WHERE r.user_id = :user_id
             ORDER BY r.registered_at DESC'
        );
        $stmt->execute(['user_id' => $userId]);

        return array_map([$this, 'formatRegistration'], $stmt->fetchAll());
    }

    public function listTickets(PDO $db, int $userId): array
    {
        $stmt = $db->prepare(
            'SELECT t.*, r.id AS registration_id, r.status AS registration_status,
                    e.id AS event_id, e.title AS event_title, e.venue, e.start_datetime,
                    e.end_datetime, e.status AS event_status, s.id AS society_id,
                    s.name AS society_name, u.name AS attendee_name, u.email AS attendee_email,
                    ci.checked_at, ci.method AS check_in_method
             FROM tickets t
             JOIN registrations r ON r.id = t.registration_id
             JOIN events e ON e.id = r.event_id
             JOIN societies s ON s.id = e.society_id
             JOIN users u ON u.id = r.user_id
             LEFT JOIN check_ins ci ON ci.ticket_id = t.id
             WHERE r.user_id = :user_id
             ORDER BY e.start_datetime ASC'
        );
        $stmt->execute(['user_id' => $userId]);

        $tickets = array_values(array_filter(
            array_map([$this, 'formatTicket'], $stmt->fetchAll()),
            fn (array $ticket): bool => $ticket['status'] !== 'cancelled'
                && $ticket['registrationStatus'] !== 'cancelled'
        ));
        $now = time();

        return [
            'upcoming' => array_values(array_filter($tickets, fn (array $ticket): bool => strtotime($ticket['eventStartAt']) >= $now)),
            'past' => array_values(array_filter($tickets, fn (array $ticket): bool => strtotime($ticket['eventStartAt']) < $now)),
            'all' => $tickets,
        ];
    }

    public function cancelRegistration(PDO $db, int $registrationId, int $userId): array
    {
        $registration = $this->findRegistrationById($db, $registrationId, $userId);
        if ($registration === null) {
            return $this->result(false, 'REGISTRATION_NOT_FOUND', 'Registration not found', 404);
        }
        if ($registration['status'] === 'cancelled') {
            return $this->result(false, 'ALREADY_CANCELLED', 'Registration is already cancelled', 409);
        }

        try {
            $db->beginTransaction();

            $heldSeat = in_array($registration['status'], ['confirmed', 'pending_payment'], true);
            $eventId = (int) $registration['event_id'];

            $stmt = $db->prepare(
                "UPDATE registrations
                 SET status = 'cancelled', cancelled_at = NOW(), waitlist_position = NULL
                 WHERE id = :id AND user_id = :user_id"
            );
            $stmt->execute(['id' => $registrationId, 'user_id' => $userId]);

            $ticketStmt = $db->prepare(
                "UPDATE tickets SET status = 'cancelled' WHERE registration_id = :registration_id"
            );
            $ticketStmt->execute(['registration_id' => $registrationId]);

            $promoted = $heldSeat ? $this->promoteNextWaitlisted($db, $eventId) : null;
            $this->renumberWaitlist($db, $eventId);

            NotificationService::create(
                $userId,
                'cancellation',
                'Registration cancelled',
                "Your registration for '{$registration['event_title']}' has been cancelled.",
                $eventId
            );

            $db->commit();

            return $this->result(true, null, null, 200, [
                'registration' => $this->formatRegistration($this->findRegistrationById($db, $registrationId, $userId)),
                'promoted' => $promoted,
            ]);
        } catch (PDOException) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }

            return $this->result(false, 'DB_ERROR', 'Could not cancel registration', 500);
        }
    }

    public function cancelTicket(PDO $db, int $ticketId, int $userId): array
    {
        $stmt = $db->prepare(
            'SELECT r.id
             FROM tickets t
             JOIN registrations r ON r.id = t.registration_id
             WHERE t.id = :ticket_id AND r.user_id = :user_id
             LIMIT 1'
        );
        $stmt->execute(['ticket_id' => $ticketId, 'user_id' => $userId]);
        $registrationId = $stmt->fetchColumn();

        if ($registrationId === false) {
            return $this->result(false, 'TICKET_NOT_FOUND', 'Ticket not found', 404);
        }

        return $this->cancelRegistration($db, (int) $registrationId, $userId);
    }

    public function createTicket(PDO $db, int $registrationId): array
    {
        $existing = $this->findTicketByRegistration($db, $registrationId);
        if ($existing !== null) {
            return $this->formatTicket($existing);
        }

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $ticketCode = $this->generateTicketCode();
            $qrToken = bin2hex(random_bytes(32));

            try {
                $stmt = $db->prepare(
                    'INSERT INTO tickets (registration_id, ticket_code, qr_token)
                     VALUES (:registration_id, :ticket_code, :qr_token)'
                );
                $stmt->execute([
                    'registration_id' => $registrationId,
                    'ticket_code' => $ticketCode,
                    'qr_token' => $qrToken,
                ]);

                return $this->formatTicket($this->findTicketByRegistration($db, $registrationId));
            } catch (PDOException $e) {
                if ($e->getCode() !== '23000' || $attempt === 4) {
                    throw $e;
                }
            }
        }

        throw new PDOException('Unable to generate unique ticket token');
    }

    public function formatRegistration(?array $row): ?array
    {
        if ($row === null) {
            return null;
        }

        return [
            'id' => (int) $row['id'],
            'eventId' => (int) $row['event_id'],
            'status' => $row['status'],
            'waitlistPosition' => $row['waitlist_position'] === null ? null : (int) $row['waitlist_position'],
            'registeredAt' => $row['registered_at'],
            'paymentHoldExpiresAt' => $row['status'] === 'pending_payment'
                ? date('Y-m-d H:i:s', strtotime($row['registered_at'] . ' +10 minutes'))
                : null,
            'cancelledAt' => $row['cancelled_at'] ?? null,
            'event' => [
                'id' => (int) $row['event_id'],
                'title' => $row['event_title'] ?? null,
                'venue' => $row['venue'] ?? null,
                'startAt' => $row['start_datetime'] ?? null,
                'endAt' => $row['end_datetime'] ?? null,
                'status' => $row['event_status'] ?? null,
                'societyName' => $row['society_name'] ?? null,
                'feeType' => $row['fee_type'] ?? null,
                'feeAmount' => isset($row['fee_amount']) ? (float) $row['fee_amount'] : null,
            ],
            'ticket' => isset($row['ticket_id']) && $row['ticket_id'] !== null ? [
                'id' => (int) $row['ticket_id'],
                'ticketCode' => $row['ticket_code'],
                'qrToken' => $row['qr_token'],
                'status' => $row['ticket_status'],
                'checkedInAt' => $row['checked_at'] ?? null,
            ] : null,
        ];
    }

    public function formatTicket(?array $row): ?array
    {
        if ($row === null) {
            return null;
        }

        return [
            'id' => (int) $row['id'],
            'ticketCode' => $row['ticket_code'],
            'qrToken' => $row['qr_token'],
            'status' => $row['status'],
            'registrationId' => (int) $row['registration_id'],
            'registrationStatus' => $row['registration_status'] ?? null,
            'eventId' => (int) $row['event_id'],
            'eventName' => $row['event_title'],
            'eventStartAt' => $row['start_datetime'],
            'eventEndAt' => $row['end_datetime'] ?? null,
            'eventStatus' => $row['event_status'] ?? null,
            'venue' => $row['venue'],
            'societyId' => (int) $row['society_id'],
            'societyName' => $row['society_name'],
            'attendeeName' => $row['attendee_name'],
            'attendeeEmail' => $row['attendee_email'],
            'issuedAt' => $row['issued_at'],
            'checkedInAt' => $row['checked_at'] ?? null,
            'checkInMethod' => $row['check_in_method'] ?? null,
            'qrPayload' => json_encode([
                'type' => 'eventora-ticket',
                'version' => 1,
                'token' => $row['qr_token'],
                'ticketCode' => $row['ticket_code'],
                'eventId' => (int) $row['event_id'],
            ]),
        ];
    }

    private function findPublicEvent(PDO $db, int $eventId): ?array
    {
        $stmt = $db->prepare(
            "SELECT e.*, s.name AS society_name
             FROM events e
             JOIN societies s ON s.id = e.society_id
             WHERE e.id = :id AND e.status = 'published'
             LIMIT 1"
        );
        $stmt->execute(['id' => $eventId]);
        $event = $stmt->fetch();

        return $event ?: null;
    }

    private function validateEventCanRegister(array $event): ?array
    {
        if ($event['status'] !== 'published') {
            return $this->result(false, 'EVENT_NOT_REGISTERABLE', 'Registration is only available for published events', 400);
        }
        if (strtotime($event['reg_deadline']) < time()) {
            return $this->result(false, 'REGISTRATION_CLOSED', 'Registration deadline has passed', 400);
        }
        if (strtotime($event['start_datetime']) <= time()) {
            return $this->result(false, 'REGISTRATION_CLOSED', 'This event has already started', 400);
        }

        return null;
    }

    private function findActiveRegistration(PDO $db, int $eventId, int $userId): ?array
    {
        $stmt = $db->prepare(
            "SELECT *
             FROM registrations
             WHERE event_id = :event_id
               AND user_id = :user_id
               AND status IN ('pending_payment', 'confirmed', 'waitlisted')
             LIMIT 1"
        );
        $stmt->execute(['event_id' => $eventId, 'user_id' => $userId]);
        $registration = $stmt->fetch();

        return $registration ?: null;
    }

    private function findCancelledRegistration(PDO $db, int $eventId, int $userId): ?array
    {
        $stmt = $db->prepare(
            "SELECT *
             FROM registrations
             WHERE event_id = :event_id
               AND user_id = :user_id
               AND status = 'cancelled'
             ORDER BY registered_at DESC
             LIMIT 1"
        );
        $stmt->execute(['event_id' => $eventId, 'user_id' => $userId]);
        $registration = $stmt->fetch();

        return $registration ?: null;
    }

    private function findRegistrationById(PDO $db, int $registrationId, int $userId): ?array
    {
        $stmt = $db->prepare(
            'SELECT r.*, e.title AS event_title, e.venue, e.start_datetime, e.end_datetime,
                    e.status AS event_status, e.fee_type, e.fee_amount, s.name AS society_name,
                    t.id AS ticket_id, t.ticket_code, t.qr_token, t.status AS ticket_status,
                    ci.checked_at
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             JOIN societies s ON s.id = e.society_id
             LEFT JOIN tickets t ON t.registration_id = r.id
             LEFT JOIN check_ins ci ON ci.ticket_id = t.id
             WHERE r.id = :id AND r.user_id = :user_id
             LIMIT 1'
        );
        $stmt->execute(['id' => $registrationId, 'user_id' => $userId]);
        $registration = $stmt->fetch();

        return $registration ?: null;
    }

    private function findTicketByRegistration(PDO $db, int $registrationId): ?array
    {
        $stmt = $db->prepare(
            'SELECT t.*, r.id AS registration_id, r.status AS registration_status,
                    e.id AS event_id, e.title AS event_title, e.venue, e.start_datetime,
                    e.end_datetime, e.status AS event_status, s.id AS society_id,
                    s.name AS society_name, u.name AS attendee_name, u.email AS attendee_email,
                    ci.checked_at, ci.method AS check_in_method
             FROM tickets t
             JOIN registrations r ON r.id = t.registration_id
             JOIN events e ON e.id = r.event_id
             JOIN societies s ON s.id = e.society_id
             JOIN users u ON u.id = r.user_id
             LEFT JOIN check_ins ci ON ci.ticket_id = t.id
             WHERE t.registration_id = :registration_id
             LIMIT 1'
        );
        $stmt->execute(['registration_id' => $registrationId]);
        $ticket = $stmt->fetch();

        return $ticket ?: null;
    }

    private function clearRegistrationArtifacts(PDO $db, int $registrationId): void
    {
        $ticketStmt = $db->prepare('DELETE FROM tickets WHERE registration_id = :registration_id');
        $ticketStmt->execute(['registration_id' => $registrationId]);

        $paymentStmt = $db->prepare('DELETE FROM payments WHERE registration_id = :registration_id');
        $paymentStmt->execute(['registration_id' => $registrationId]);
    }

    private function countOccupiedSeats(PDO $db, int $eventId): int
    {
        $stmt = $db->prepare(
            "SELECT COUNT(*)
             FROM registrations
             WHERE event_id = :event_id AND status IN ('confirmed', 'pending_payment')"
        );
        $stmt->execute(['event_id' => $eventId]);

        return (int) $stmt->fetchColumn();
    }

    private function nextWaitlistPosition(PDO $db, int $eventId): int
    {
        $stmt = $db->prepare(
            "SELECT COALESCE(MAX(waitlist_position), 0) + 1
             FROM registrations
             WHERE event_id = :event_id AND status = 'waitlisted'"
        );
        $stmt->execute(['event_id' => $eventId]);

        return (int) $stmt->fetchColumn();
    }

    private function createPayment(PDO $db, int $registrationId, float $amount): array
    {
        $mockRef = 'PAY-' . strtoupper(bin2hex(random_bytes(6)));
        $stmt = $db->prepare(
            'INSERT INTO payments (registration_id, amount, status, mock_ref)
             VALUES (:registration_id, :amount, :status, :mock_ref)'
        );
        $stmt->execute([
            'registration_id' => $registrationId,
            'amount' => $amount,
            'status' => 'pending',
            'mock_ref' => $mockRef,
        ]);

        return [
            'amount' => $amount,
            'status' => 'pending',
            'mockRef' => $mockRef,
        ];
    }

    private function promoteNextWaitlisted(PDO $db, int $eventId): ?array
    {
        $stmt = $db->prepare(
            "SELECT r.*, e.fee_type, e.fee_amount, e.title AS event_title
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             WHERE r.event_id = :event_id AND r.status = 'waitlisted'
             ORDER BY r.waitlist_position ASC, r.registered_at ASC
             LIMIT 1"
        );
        $stmt->execute(['event_id' => $eventId]);
        $registration = $stmt->fetch();

        if (!$registration) {
            return null;
        }

        $status = ((float) $registration['fee_amount'] > 0.0 || $registration['fee_type'] === 'paid')
            ? 'pending_payment'
            : 'confirmed';

        $updateStmt = $db->prepare(
            'UPDATE registrations SET status = :status, waitlist_position = NULL WHERE id = :id'
        );
        $updateStmt->execute(['status' => $status, 'id' => (int) $registration['id']]);

        $ticket = null;
        if ($status === 'pending_payment') {
            $this->createPayment($db, (int) $registration['id'], (float) $registration['fee_amount']);
        } else {
            $ticket = $this->createTicket($db, (int) $registration['id']);
        }

        NotificationService::create(
            (int) $registration['user_id'],
            'waitlist',
            'Waitlist promoted',
            $status === 'pending_payment'
                ? "A seat opened for '{$registration['event_title']}'. Complete mock payment to receive your QR ticket."
                : "A seat opened for '{$registration['event_title']}'. Your QR ticket is ready.",
            $eventId
        );

        return [
            'registrationId' => (int) $registration['id'],
            'status' => $status,
            'ticket' => $ticket,
        ];
    }

    private function renumberWaitlist(PDO $db, int $eventId): void
    {
        $stmt = $db->prepare(
            "SELECT id
             FROM registrations
             WHERE event_id = :event_id AND status = 'waitlisted'
             ORDER BY waitlist_position ASC, registered_at ASC"
        );
        $stmt->execute(['event_id' => $eventId]);
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $update = $db->prepare('UPDATE registrations SET waitlist_position = :position WHERE id = :id');
        foreach ($ids as $index => $id) {
            $update->execute(['position' => $index + 1, 'id' => (int) $id]);
        }
    }

    private function generateTicketCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $groups = [];
        for ($group = 0; $group < 3; $group++) {
            $value = '';
            for ($i = 0; $i < 4; $i++) {
                $value .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $groups[] = $value;
        }

        return 'EO-' . implode('-', $groups);
    }

    private function registrationMessage(string $eventTitle, string $status, ?int $waitlistPosition): string
    {
        if ($status === 'confirmed') {
            return "{$eventTitle} is confirmed. Your QR ticket is ready.";
        }
        if ($status === 'pending_payment') {
            return "{$eventTitle} is reserved. Complete mock payment to receive your QR ticket.";
        }

        return "{$eventTitle} is full. You are now #{$waitlistPosition} on the waitlist.";
    }

    private function result(bool $success, ?string $code, ?string $message, int $status, mixed $data = null): array
    {
        return [
            'success' => $success,
            'code' => $code,
            'message' => $message,
            'status' => $status,
            'data' => $data,
        ];
    }
}
