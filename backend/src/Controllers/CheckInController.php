<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Database;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CheckInController
{
    public function listEventTickets(Request $request, Response $response, array $args): Response
    {
        $organiserId = (int) $request->getAttribute('user')['sub'];
        $eventId = (int) $args['id'];
        $db = Database::getConnection();

        if (!$this->organiserOwnsEvent($db, $organiserId, $eventId)) {
            return $this->errorResponse($response, 'FORBIDDEN', 'You do not have access to this event', 403);
        }

        $stmt = $db->prepare(
            "SELECT t.id, t.ticket_code, t.qr_token, t.status, t.issued_at,
                    r.id AS registration_id, e.id AS event_id, e.title AS event_title,
                    e.venue, e.start_datetime, s.id AS society_id, s.name AS society_name,
                    u.name AS attendee_name, u.email AS attendee_email,
                    ci.checked_at, ci.method AS check_in_method
             FROM tickets t
             JOIN registrations r ON r.id = t.registration_id
             JOIN events e ON e.id = r.event_id
             JOIN societies s ON s.id = e.society_id
             JOIN users u ON u.id = r.user_id
             LEFT JOIN check_ins ci ON ci.ticket_id = t.id
             WHERE e.id = :event_id
               AND r.status = 'confirmed'
               AND t.status <> 'cancelled'
             ORDER BY u.name ASC"
        );
        $stmt->execute(['event_id' => $eventId]);

        return $this->successResponse($response, array_map([$this, 'formatTicket'], $stmt->fetchAll()), 200);
    }

    public function create(Request $request, Response $response): Response
    {
        $organiserId = (int) $request->getAttribute('user')['sub'];
        $data = $request->getParsedBody() ?? [];
        $eventId = (int) ($data['event_id'] ?? $data['eventId'] ?? 0);
        $code = trim((string) ($data['code'] ?? $data['ticket_code'] ?? $data['ticketCode'] ?? $data['qr_token'] ?? ''));
        $method = ($data['method'] ?? 'manual_entry') === 'qr_scan' ? 'qr_scan' : 'manual_entry';

        if ($eventId <= 0 || $code === '') {
            return $this->errorResponse($response, 'VALIDATION_ERROR', 'event_id and code are required', 422);
        }

        $db = Database::getConnection();
        $ticket = $this->findTicket($db, $code);

        if ($ticket === null || $ticket['ticket_status'] === 'cancelled') {
            return $this->checkInResult($response, 'invalid_ticket', 'Invalid ticket.', null, 404);
        }

        if ((int) $ticket['event_id'] !== $eventId) {
            return $this->checkInResult($response, 'wrong_event', 'This ticket belongs to a different event.', $ticket, 409);
        }

        if (!$this->organiserOwnsEvent($db, $organiserId, $eventId)) {
            return $this->checkInResult($response, 'wrong_society', 'This organiser cannot check in tickets for this society.', $ticket, 403);
        }

        if ($ticket['checked_at'] !== null || $ticket['ticket_status'] === 'used') {
            return $this->checkInResult($response, 'already_checked_in', 'This attendee has already checked in.', $ticket, 409);
        }

        try {
            $db->beginTransaction();

            $stmt = $db->prepare(
                'INSERT INTO check_ins (ticket_id, checked_by, method)
                 VALUES (:ticket_id, :checked_by, :method)'
            );
            $stmt->execute([
                'ticket_id' => (int) $ticket['id'],
                'checked_by' => $organiserId,
                'method' => $method,
            ]);

            $updateStmt = $db->prepare("UPDATE tickets SET status = 'used' WHERE id = :id");
            $updateStmt->execute(['id' => (int) $ticket['id']]);

            $db->commit();
        } catch (\PDOException) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }

            return $this->checkInResult($response, 'already_checked_in', 'This attendee has already checked in.', $ticket, 409);
        }

        $updated = $this->findTicket($db, $code);

        return $this->checkInResult($response, 'success', 'Check-in successful.', $updated, 201);
    }

    private function findTicket(\PDO $db, string $rawCode): ?array
    {
        $code = trim($rawCode);
        $decodedToken = $this->extractTokenFromPayload($code);
        $normalizedCode = strtoupper($code);

        $stmt = $db->prepare(
            "SELECT t.id, t.ticket_code, t.qr_token, t.status AS ticket_status, t.issued_at,
                    r.id AS registration_id, r.status AS registration_status,
                    e.id AS event_id, e.title AS event_title, e.venue, e.start_datetime,
                    s.id AS society_id, s.name AS society_name,
                    u.name AS attendee_name, u.email AS attendee_email,
                    ci.checked_at, ci.method AS check_in_method
             FROM tickets t
             JOIN registrations r ON r.id = t.registration_id
             JOIN events e ON e.id = r.event_id
             JOIN societies s ON s.id = e.society_id
             JOIN users u ON u.id = r.user_id
             LEFT JOIN check_ins ci ON ci.ticket_id = t.id
             WHERE t.qr_token = :token
                OR t.qr_token = :decoded_token
                OR UPPER(t.ticket_code) = :ticket_code
             LIMIT 1"
        );
        $stmt->execute([
            'token' => $code,
            'decoded_token' => $decodedToken ?? $code,
            'ticket_code' => $normalizedCode,
        ]);
        $ticket = $stmt->fetch();

        return $ticket ?: null;
    }

    private function extractTokenFromPayload(string $code): ?string
    {
        $payload = json_decode($code, true);
        if (!is_array($payload)) {
            return null;
        }

        return $payload['token'] ?? $payload['qrToken'] ?? null;
    }

    private function organiserOwnsEvent(\PDO $db, int $organiserId, int $eventId): bool
    {
        $stmt = $db->prepare(
            'SELECT 1
             FROM events e
             JOIN society_members sm ON sm.society_id = e.society_id
             WHERE e.id = :event_id AND sm.user_id = :organiser_id
             LIMIT 1'
        );
        $stmt->execute(['event_id' => $eventId, 'organiser_id' => $organiserId]);

        return $stmt->fetch() !== false;
    }

    private function checkInResult(Response $response, string $status, string $message, ?array $ticket, int $httpStatus): Response
    {
        return $this->successResponse($response, [
            'status' => $status,
            'message' => $message,
            'ticket' => $ticket === null ? null : $this->formatTicket($ticket),
        ], $httpStatus);
    }

    private function formatTicket(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'ticketCode' => $row['ticket_code'],
            'qrToken' => $row['qr_token'],
            'status' => $row['ticket_status'] ?? $row['status'],
            'registrationId' => (int) $row['registration_id'],
            'eventId' => (int) $row['event_id'],
            'eventName' => $row['event_title'],
            'venue' => $row['venue'],
            'eventStartAt' => $row['start_datetime'],
            'societyId' => (int) $row['society_id'],
            'societyName' => $row['society_name'],
            'attendeeName' => $row['attendee_name'],
            'attendeeEmail' => $row['attendee_email'],
            'issuedAt' => $row['issued_at'],
            'checkedInAt' => $row['checked_at'],
            'checkInMethod' => $row['check_in_method'] ?? null,
        ];
    }

    private function successResponse(Response $response, mixed $data, int $status): Response
    {
        $response->getBody()->write(json_encode(['success' => true, 'data' => $data]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    private function errorResponse(Response $response, string $code, string $message, int $status): Response
    {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'fields' => [],
            ],
        ]));

        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
