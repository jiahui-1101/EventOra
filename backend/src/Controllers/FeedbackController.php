<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Database;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * FeedbackController — Module 7 (Post-Event Features)
 *
 * Routes (all require JWT + organiser role):
 *   GET /api/events/{id}/feedback           → list all feedback + avg rating for an event
 *   GET /api/events/{id}/attendance/export  → download attendance as CSV
 *
 * Both routes are organiser-only and validate that the requesting
 * organiser actually owns the event (via society membership) before
 * returning any data.
 */
class FeedbackController
{
    // ----------------------------------------------------------------
    // GET /api/events/{id}/feedback
    // Returns:
    //   - averageRating (float|null)
    //   - totalFeedback (int)
    //   - ratingBreakdown (1-5 counts)
    //   - reviews (list of individual feedback entries)
    // ----------------------------------------------------------------
    public function listFeedback(Request $request, Response $response, array $args): Response
    {
        $organiserId = (int) $request->getAttribute('user')['sub'];
        $eventId     = (int) $args['id'];
        $db = Database::getConnection();

        // Ownership check — organiser must belong to the society that owns this event
        if (!$this->organiserOwnsEvent($db, $organiserId, $eventId)) {
            return $this->errorResponse($response, 'FORBIDDEN', 'You do not have access to this event', [], 403);
        }

        // Aggregate stats
        $statsStmt = $db->prepare(
            'SELECT
                COUNT(*)          AS total_feedback,
                AVG(rating)       AS average_rating,
                SUM(rating = 1)   AS rating_1,
                SUM(rating = 2)   AS rating_2,
                SUM(rating = 3)   AS rating_3,
                SUM(rating = 4)   AS rating_4,
                SUM(rating = 5)   AS rating_5
             FROM feedback
             WHERE event_id = :event_id'
        );
        $statsStmt->execute(['event_id' => $eventId]);
        $stats = $statsStmt->fetch();

        // Individual reviews, joined with the reviewer's name so the
        // organiser knows who said what
        $reviewsStmt = $db->prepare(
            'SELECT
                f.id,
                f.rating,
                f.comment,
                f.created_at AS submitted_at,
                u.name AS reviewer_name,
                u.matric_no
             FROM feedback f
             JOIN users u ON u.id = f.user_id
             WHERE f.event_id = :event_id
             ORDER BY f.created_at DESC'
        );
        $reviewsStmt->execute(['event_id' => $eventId]);
        $reviews = $reviewsStmt->fetchAll();

        $totalFeedback = (int) $stats['total_feedback'];
        $averageRating = $stats['average_rating'] !== null
            ? round((float) $stats['average_rating'], 2)
            : null;

        return $this->successResponse($response, [
            'eventId'       => $eventId,
            'totalFeedback' => $totalFeedback,
            'averageRating' => $averageRating,
            'ratingBreakdown' => [
                5 => (int) $stats['rating_5'],
                4 => (int) $stats['rating_4'],
                3 => (int) $stats['rating_3'],
                2 => (int) $stats['rating_2'],
                1 => (int) $stats['rating_1'],
            ],
            'reviews' => array_map(fn (array $row): array => [
                'id'           => (int) $row['id'],
                'reviewerName' => $row['reviewer_name'],
                'matricNo'     => $row['matric_no'],
                'rating'       => (int) $row['rating'],
                'comment'      => $row['comment'],
                'submittedAt'  => $row['submitted_at'],
            ], $reviews),
        ], null, 200);
    }

    // ----------------------------------------------------------------
    // GET /api/events/{id}/attendance/export
    // Streams a UTF-8 CSV file with one row per confirmed attendee.
    // Columns: Name, Matric No, Email, Ticket Code, Checked In,
    //          Check-in Time, Check-in Method
    // ----------------------------------------------------------------
    public function exportAttendanceCsv(Request $request, Response $response, array $args): Response
    {
        $organiserId = (int) $request->getAttribute('user')['sub'];
        $eventId     = (int) $args['id'];
        $db = Database::getConnection();

        if (!$this->organiserOwnsEvent($db, $organiserId, $eventId)) {
            return $this->errorResponse($response, 'FORBIDDEN', 'You do not have access to this event', [], 403);
        }

        // Fetch event title for the filename
        $eventStmt = $db->prepare('SELECT title FROM events WHERE id = :id LIMIT 1');
        $eventStmt->execute(['id' => $eventId]);
        $event = $eventStmt->fetch();

        if ($event === false) {
            return $this->errorResponse($response, 'NOT_FOUND', 'Event not found', [], 404);
        }

        // All confirmed registrations with check-in status
        $stmt = $db->prepare(
            "SELECT
                u.name,
                u.matric_no,
                u.email,
                t.qr_token AS ticket_code,
                CASE WHEN ci.id IS NOT NULL THEN 'Yes' ELSE 'No' END AS checked_in,
                ci.checked_at,
                ci.method AS check_in_method
             FROM registrations reg
             JOIN users u ON u.id = reg.user_id
             LEFT JOIN tickets t ON t.registration_id = reg.id
             LEFT JOIN check_ins ci ON ci.ticket_id = t.id
             WHERE reg.event_id = :event_id
               AND reg.status = 'confirmed'
             ORDER BY u.name ASC"
        );
        $stmt->execute(['event_id' => $eventId]);
        $rows = $stmt->fetchAll();

        // Build CSV in memory — attendance lists are never large enough
        // to warrant chunked streaming in a university context
        $csv = $this->buildCsv(
            ['Name', 'Matric No', 'Email', 'Ticket Code', 'Checked In', 'Check-in Time', 'Check-in Method'],
            array_map(fn (array $row): array => [
                $row['name'],
                $row['matric_no'] ?? '',
                $row['email'],
                $row['ticket_code'] ?? '',
                $row['checked_in'],
                $row['checked_at'] ?? '',
                $row['check_in_method'] ?? '',
            ], $rows)
        );

        // Sanitise event title for use as a filename
        $safeTitle = preg_replace('/[^a-z0-9]+/i', '-', $event['title']);
        $safeTitle = trim($safeTitle, '-');
        $filename  = "attendance-event-{$eventId}-{$safeTitle}.csv";

        $response->getBody()->write($csv);

        return $response
            ->withHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->withHeader('Content-Disposition', "attachment; filename=\"{$filename}\"")
            ->withHeader('Cache-Control', 'no-cache')
            ->withStatus(200);
    }

    public function listAttendance(Request $request, Response $response, array $args): Response
{
    $organiserId = (int) $request->getAttribute('user')['sub'];
    $eventId = (int) $args['id'];
    $db = Database::getConnection();

    if (!$this->organiserOwnsEvent($db, $organiserId, $eventId)) {
        return $this->errorResponse($response, 'FORBIDDEN', 'You do not have access to this event', [], 403);
    }

    $eventStmt = $db->prepare('SELECT id, title, capacity FROM events WHERE id = :id LIMIT 1');
    $eventStmt->execute(['id' => $eventId]);
    $event = $eventStmt->fetch();

    if ($event === false) {
        return $this->errorResponse($response, 'NOT_FOUND', 'Event not found', [], 404);
    }

    $stmt = $db->prepare(
        "SELECT
            reg.id AS registration_id,
            u.name,
            u.matric_no,
            u.email,
            t.qr_token AS ticket_code,
            CASE WHEN ci.id IS NOT NULL THEN 1 ELSE 0 END AS checked_in,
            ci.checked_at,
            ci.method AS check_in_method
         FROM registrations reg
         JOIN users u ON u.id = reg.user_id
         LEFT JOIN tickets t ON t.registration_id = reg.id
         LEFT JOIN check_ins ci ON ci.ticket_id = t.id
         WHERE reg.event_id = :event_id
           AND reg.status = 'confirmed'
         ORDER BY u.name ASC"
    );

    $stmt->execute(['event_id' => $eventId]);
    $rows = $stmt->fetchAll();

    $checkedInCount = 0;

    $participants = array_map(function (array $row) use (&$checkedInCount): array {
        $checkedIn = (bool) $row['checked_in'];

        if ($checkedIn) {
            $checkedInCount++;
        }

        return [
            'registrationId' => (int) $row['registration_id'],
            'name' => $row['name'],
            'matricNo' => $row['matric_no'] ?? '',
            'email' => $row['email'],
            'ticketCode' => $row['ticket_code'] ?? '',
            'checkedIn' => $checkedIn,
            'checkedAt' => $row['checked_at'],
            'checkInMethod' => $row['check_in_method'] ?? '',
        ];
    }, $rows);

    return $this->successResponse($response, [
        'eventId' => (int) $event['id'],
        'eventTitle' => $event['title'],
        'capacity' => (int) $event['capacity'],
        'totalParticipants' => count($participants),
        'checkedInCount' => $checkedInCount,
        'participants' => $participants,
    ], null, 200);
}

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------

    /**
     * Returns true if $organiserId is a member of the society that
     * created event $eventId.  Same ownership logic used by DashboardController.
     */
    private function organiserOwnsEvent(\PDO $db, int $organiserId, int $eventId): bool
    {
        $stmt = $db->prepare(
            'SELECT 1
             FROM events e
             JOIN society_members sm ON sm.society_id = e.society_id
             WHERE e.id = :event_id
               AND sm.user_id = :organiser_id
             LIMIT 1'
        );
        $stmt->execute(['event_id' => $eventId, 'organiser_id' => $organiserId]);
        return $stmt->fetch() !== false;
    }

    /**
     * Builds a CSV string from a header row and data rows.
     * Values are wrapped in double-quotes and internal quotes are escaped.
     */
    private function buildCsv(array $headers, array $rows): string
    {
        $lines   = [];
        $lines[] = $this->csvRow($headers);
        foreach ($rows as $row) {
            $lines[] = $this->csvRow($row);
        }
        // BOM makes Excel open the file in UTF-8 automatically
        return "\xEF\xBB\xBF" . implode("\r\n", $lines);
    }

    private function csvRow(array $values): string
    {
        return implode(',', array_map(function (string $value): string {
            // Escape any double-quotes inside the value
            $escaped = str_replace('"', '""', $value);
            return "\"{$escaped}\"";
        }, array_map('strval', $values)));
    }

    private function successResponse(Response $response, mixed $data, ?string $message, int $status): Response
    {
        $payload = ['success' => true, 'data' => $data];
        if ($message !== null) {
            $payload['message'] = $message;
        }
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    private function errorResponse(Response $response, string $code, string $message, array $fields, int $status): Response
    {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error'   => [
                'code'    => $code,
                'message' => $message,
                'fields'  => $fields,
            ],
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
