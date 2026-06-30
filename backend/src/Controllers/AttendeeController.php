<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Database;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;
use PDOException;

class AttendeeController
{
    public function completedEvents(Request $request, Response $response): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];
        $db = Database::getConnection();

        $stmt = $db->prepare(
            'SELECT
                e.id,
                e.title,
                e.category,
                e.venue,
                e.start_datetime,
                e.poster_url,
                s.name AS society_name,
                r.id AS registration_id,
                ci.checked_at,
                f.rating,
                f.comment,
                f.created_at AS feedback_at,
                c.certificate_code,
                c.issued_at AS certificate_issued_at
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             JOIN societies s ON s.id = e.society_id
             LEFT JOIN tickets t ON t.registration_id = r.id
             LEFT JOIN check_ins ci ON ci.ticket_id = t.id
             LEFT JOIN feedback f ON f.event_id = e.id AND f.user_id = r.user_id
             LEFT JOIN certificates c ON c.registration_id = r.id
             WHERE r.user_id = :user_id
               AND r.status = :registration_status
               AND (e.status = :event_status OR ci.id IS NOT NULL)
             ORDER BY e.start_datetime DESC'
        );
        $stmt->execute([
            'user_id' => $userId,
            'registration_status' => 'confirmed',
            'event_status' => 'completed',
        ]);

        $events = array_map(
            fn (array $row): array => $this->formatCompletedEvent($row),
            $stmt->fetchAll()
        );

        return $this->successResponse($response, $events, null, 200);
    }

    public function submitFeedback(Request $request, Response $response, array $args): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];
        $eventId = (int) $args['id'];
        $data = $request->getParsedBody();
        $rating = (int) ($data['rating'] ?? 0);
        $comment = trim((string) ($data['comment'] ?? '')) ?: null;

        if ($rating < 1 || $rating > 5) {
            return $this->errorResponse($response, 'VALIDATION_ERROR', 'Validation failed', [
                'rating' => 'Rating must be between 1 and 5',
            ], 422);
        }

        $db = Database::getConnection();
        $registration = $this->findEligibleCompletedRegistration($db, $eventId, $userId);

        if ($registration === null) {
            return $this->errorResponse($response, 'NOT_ELIGIBLE', 'Only checked-in attendees can submit feedback', [], 403);
        }

        try {
            $stmt = $db->prepare(
                'INSERT INTO feedback (event_id, user_id, rating, comment)
                 VALUES (:event_id, :user_id, :rating, :comment)
                 ON DUPLICATE KEY UPDATE
                    rating = VALUES(rating),
                    comment = VALUES(comment)'
            );
            $stmt->execute([
                'event_id' => $eventId,
                'user_id' => $userId,
                'rating' => $rating,
                'comment' => $comment,
            ]);
        } catch (PDOException $e) {
            return $this->errorResponse($response, 'DB_ERROR', 'Could not save feedback', [], 500);
        }

        return $this->successResponse($response, [
            'event_id' => $eventId,
            'rating' => $rating,
            'comment' => $comment,
        ], 'Feedback saved', 200);
    }

    public function issueCertificate(Request $request, Response $response, array $args): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];
        $eventId = (int) $args['id'];
        $db = Database::getConnection();
        $registration = $this->findEligibleCompletedRegistration($db, $eventId, $userId);

        if ($registration === null) {
            return $this->errorResponse($response, 'NOT_ELIGIBLE', 'Only checked-in attendees can issue certificates', [], 403);
        }

        try {
            $certificate = $this->issueOrFindCertificate($db, (int) $registration['registration_id']);
        } catch (PDOException) {
            return $this->errorResponse($response, 'DB_ERROR', 'Could not issue certificate', [], 500);
        }

        return $this->successResponse($response, [
            'certificate_code' => $certificate['certificate_code'],
            'issued_at' => $certificate['issued_at'],
        ], 'Certificate issued', 200);
    }

    public function downloadCertificate(Request $request, Response $response, array $args): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];
        $eventId = (int) $args['id'];
        $db = Database::getConnection();
        $registration = $this->findEligibleCompletedRegistration($db, $eventId, $userId, true);

        if ($registration === null) {
            return $this->errorResponse($response, 'NOT_ELIGIBLE', 'Only checked-in attendees can download certificates', [], 403);
        }

        try {
            $certificate = $this->issueOrFindCertificate($db, (int) $registration['registration_id']);
        } catch (PDOException) {
            return $this->errorResponse($response, 'DB_ERROR', 'Could not issue certificate', [], 500);
        }

        $html = $this->renderCertificateHtml($registration, $certificate);
        $filename = 'eventora-certificate-' . preg_replace('/[^A-Za-z0-9_-]+/', '-', strtolower($certificate['certificate_code'])) . '.html';

        $response->getBody()->write($html);
        return $response
            ->withHeader('Content-Type', 'text/html; charset=utf-8')
            ->withHeader('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->withStatus(200);
    }

    private function findEligibleCompletedRegistration(PDO $db, int $eventId, int $userId, bool $includeCertificateDetails = false): ?array
    {
        $select = $includeCertificateDetails
            ? ', e.title AS event_title, e.start_datetime, s.name AS society_name, u.name AS attendee_name, u.email AS attendee_email'
            : '';

        $stmt = $db->prepare(
            'SELECT r.id AS registration_id' . $select . '
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             JOIN societies s ON s.id = e.society_id
             JOIN users u ON u.id = r.user_id
             JOIN tickets t ON t.registration_id = r.id
             JOIN check_ins ci ON ci.ticket_id = t.id
             WHERE r.event_id = :event_id
               AND r.user_id = :user_id
               AND r.status = :registration_status
               AND (e.status = :event_status OR ci.id IS NOT NULL)
             LIMIT 1'
        );
        $stmt->execute([
            'event_id' => $eventId,
            'user_id' => $userId,
            'registration_status' => 'confirmed',
            'event_status' => 'completed',
        ]);
        $registration = $stmt->fetch();

        return $registration ?: null;
    }

    private function issueOrFindCertificate(PDO $db, int $registrationId): array
    {
        $code = 'CERT-' . strtoupper(bin2hex(random_bytes(6)));
        $stmt = $db->prepare(
            'INSERT INTO certificates (registration_id, certificate_code)
             VALUES (:registration_id, :certificate_code)
             ON DUPLICATE KEY UPDATE certificate_code = certificate_code'
        );
        $stmt->execute([
            'registration_id' => $registrationId,
            'certificate_code' => $code,
        ]);

        return $this->findCertificate($db, $registrationId);
    }

    private function findCertificate(PDO $db, int $registrationId): array
    {
        $stmt = $db->prepare(
            'SELECT certificate_code, issued_at
             FROM certificates
             WHERE registration_id = :registration_id'
        );
        $stmt->execute(['registration_id' => $registrationId]);

        return $stmt->fetch();
    }

    private function renderCertificateHtml(array $registration, array $certificate): string
    {
        $attendeeName = htmlspecialchars($registration['attendee_name'] ?: $registration['attendee_email'], ENT_QUOTES, 'UTF-8');
        $eventTitle = htmlspecialchars($registration['event_title'], ENT_QUOTES, 'UTF-8');
        $societyName = htmlspecialchars($registration['society_name'], ENT_QUOTES, 'UTF-8');
        $certificateCode = htmlspecialchars($certificate['certificate_code'], ENT_QUOTES, 'UTF-8');
        $eventDate = htmlspecialchars(date('j F Y', strtotime($registration['start_datetime'])), ENT_QUOTES, 'UTF-8');
        $issuedAt = htmlspecialchars(date('j F Y, g:i A', strtotime($certificate['issued_at'])), ENT_QUOTES, 'UTF-8');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>EventOra Certificate {$certificateCode}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef2f7; color: #0f172a; font-family: Georgia, "Times New Roman", serif; }
    .certificate { width: min(920px, calc(100% - 48px)); padding: 56px 48px; border: 12px solid #1e3a8a; background: #fff; text-align: center; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16); position: relative; }
    .certificate::before { content: "UTM VERIFIED"; position: absolute; inset: 0; display: grid; place-items: center; transform: rotate(-18deg); color: rgba(30, 58, 138, 0.045); font: 900 76px Arial, sans-serif; pointer-events: none; }
    .content { position: relative; z-index: 1; }
    h1 { margin: 0 0 10px; color: #1e3a8a; font: 800 42px Arial, sans-serif; letter-spacing: 0.08em; }
    .eyebrow { margin: 0 0 42px; color: #64748b; font: 700 14px Arial, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; }
    .awardee { display: inline-block; min-width: 360px; margin: 12px 0 22px; padding-bottom: 8px; border-bottom: 2px solid #cbd5e1; font-size: 34px; font-weight: 700; }
    .event { margin: 22px auto; max-width: 720px; color: #1d4ed8; font-size: 28px; font-weight: 700; }
    .body-copy { margin: 0; color: #475569; font-size: 18px; line-height: 1.6; }
    .footer { margin-top: 48px; padding-top: 18px; border-top: 1px solid #e2e8f0; color: #64748b; font: 700 13px Arial, sans-serif; }
    @media print { body { background: #fff; } .certificate { box-shadow: none; width: auto; min-height: 80vh; } }
  </style>
</head>
<body>
  <main class="certificate">
    <section class="content">
      <h1>CERTIFICATE OF PARTICIPATION</h1>
      <p class="eyebrow">Universiti Teknologi Malaysia</p>
      <p class="body-copy">This is proudly presented to</p>
      <div class="awardee">{$attendeeName}</div>
      <p class="body-copy">for verified attendance and active completion of</p>
      <div class="event">{$eventTitle}</div>
      <p class="body-copy">organized by {$societyName} on {$eventDate}</p>
      <div class="footer">Certificate ID: {$certificateCode} · Issued {$issuedAt} · Verified by EventOra attendance records</div>
    </section>
  </main>
</body>
</html>
HTML;
    }

    private function formatCompletedEvent(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'societyName' => $row['society_name'],
            'category' => $row['category'],
            'venue' => $row['venue'],
            'startAt' => $row['start_datetime'],
            'checkedIn' => $row['checked_at'] !== null,
            'checkedInAt' => $row['checked_at'],
            'posterUrl' => $row['poster_url'] ?? null,
            'poster_url' => $row['poster_url'] ?? null,
            'feedback' => $row['rating'] === null ? null : [
                'rating' => (int) $row['rating'],
                'comment' => $row['comment'],
                'submittedAt' => $row['feedback_at'],
            ],
            'certificate' => $row['certificate_code'] === null ? null : [
                'code' => $row['certificate_code'],
                'issuedAt' => $row['certificate_issued_at'],
            ],
        ];
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
            'error' => [
                'code' => $code,
                'message' => $message,
                'fields' => $fields,
            ],
        ]));

        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
