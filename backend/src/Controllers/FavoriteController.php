<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Database;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDOException;

/**
 * FavoriteController — Module 3 (Activity Discovery)
 *
 * Routes (all require JWT, any role):
 *   GET    /api/favorites        → list the current user's favorited events
 *   POST   /api/favorites/{id}   → add event {id} to favorites
 *   DELETE /api/favorites/{id}   → remove event {id} from favorites
 */
class FavoriteController
{
    // ----------------------------------------------------------------
    // GET /api/favorites
    // Returns the full public-facing event shape for every favorited
    // event, including seatsLeft so the discovery UI can show capacity.
    // ----------------------------------------------------------------
    public function listFavorites(Request $request, Response $response): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];
        $db = Database::getConnection();

        $stmt = $db->prepare(
            "SELECT
                e.id,
                e.title,
                e.description,
                e.venue,
                e.category,
                e.start_datetime,
                e.end_datetime,
                e.reg_deadline,
                e.capacity,
                e.fee_type,
                e.fee_amount,
                e.waitlist_enabled,
                e.status,
                e.poster_url,
                e.contact_person,
                e.contact_email,
                e.special_instructions,
                e.cancellation_reason,
                e.created_at,
                e.updated_at,
                s.name AS society_name,
                (SELECT COUNT(*) FROM registrations r
                 WHERE r.event_id = e.id AND r.status = 'confirmed') AS confirmed_registrations,
                f.created_at AS favorited_at
             FROM favorites f
             JOIN events e ON e.id = f.event_id
             JOIN societies s ON s.id = e.society_id
             WHERE f.user_id = :user_id
             ORDER BY f.created_at DESC"
        );
        $stmt->execute(['user_id' => $userId]);

        $events = array_map(
            fn (array $row): array => $this->formatFavoriteEvent($row),
            $stmt->fetchAll()
        );

        return $this->successResponse($response, $events, null, 200);
    }

    // ----------------------------------------------------------------
    // POST /api/favorites/{id}
    // Idempotent — favoriting an already-favorited event returns 200,
    // not an error, so the frontend can fire-and-forget without
    // checking state first.
    // ----------------------------------------------------------------
    public function addFavorite(Request $request, Response $response, array $args): Response
    {
        $userId  = (int) $request->getAttribute('user')['sub'];
        $eventId = (int) $args['id'];
        $db = Database::getConnection();

        // Verify the event exists and is published before allowing favorites.
        // We don't want users bookmarking draft or rejected events.
        $eventStmt = $db->prepare(
            'SELECT id FROM events WHERE id = :id AND status = :status LIMIT 1'
        );
        $eventStmt->execute(['id' => $eventId, 'status' => 'published']);

        if ($eventStmt->fetch() === false) {
            return $this->errorResponse(
                $response,
                'NOT_FOUND',
                'Event not found or not available',
                [],
                404
            );
        }

        try {
            $stmt = $db->prepare(
                'INSERT IGNORE INTO favorites (user_id, event_id)
                 VALUES (:user_id, :event_id)'
            );
            $stmt->execute(['user_id' => $userId, 'event_id' => $eventId]);
        } catch (PDOException) {
            return $this->errorResponse($response, 'DB_ERROR', 'Could not save favorite', [], 500);
        }

        return $this->successResponse($response, [
            'eventId'     => $eventId,
            'isFavorited' => true,
        ], 'Event added to favorites', 200);
    }

    // ----------------------------------------------------------------
    // DELETE /api/favorites/{id}
    // Also idempotent — removing a non-existent favorite still 200s.
    // ----------------------------------------------------------------
    public function removeFavorite(Request $request, Response $response, array $args): Response
    {
        $userId  = (int) $request->getAttribute('user')['sub'];
        $eventId = (int) $args['id'];
        $db = Database::getConnection();

        try {
            $stmt = $db->prepare(
                'DELETE FROM favorites WHERE user_id = :user_id AND event_id = :event_id'
            );
            $stmt->execute(['user_id' => $userId, 'event_id' => $eventId]);
        } catch (PDOException) {
            return $this->errorResponse($response, 'DB_ERROR', 'Could not remove favorite', [], 500);
        }

        return $this->successResponse($response, [
            'eventId'     => $eventId,
            'isFavorited' => false,
        ], 'Event removed from favorites', 200);
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------

    private function formatFavoriteEvent(array $row): array
    {
        $confirmedCount = (int) ($row['confirmed_registrations'] ?? 0);
        $capacity       = (int) $row['capacity'];

        return [
            'id'                   => (int) $row['id'],
            'title'                => $row['title'],
            'description'          => $row['description'] ?? '',
            'category'             => $row['category'],
            'societyName'          => $row['society_name'] ?? null,
            'venue'                => $row['venue'],
            'startAt'              => $row['start_datetime'],
            'endAt'                => $row['end_datetime'],
            'registrationDeadline' => $row['reg_deadline'],
            'capacity'             => $capacity,
            'confirmedCount'       => $confirmedCount,
            'seatsLeft'            => max($capacity - $confirmedCount, 0),
            'feeType'              => $row['fee_type'],
            'feeAmount'            => (float) $row['fee_amount'],
            'priceType'            => $row['fee_type'],
            'price'                => (float) $row['fee_amount'],
            'waitlistEnabled'      => (bool) $row['waitlist_enabled'],
            'status'               => $row['status'],
            'posterUrl'            => $row['poster_url'] ?? null,
            'contactName'          => $row['contact_person'] ?? null,
            'contactEmail'         => $row['contact_email'] ?? null,
            'specialInstructions'  => $row['special_instructions'] ?? null,
            'cancellationReason'   => $row['cancellation_reason'] ?? null,
            'isFavorited'          => true,
            'favoritedAt'          => $row['favorited_at'],
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
            'error'   => [
                'code'    => $code,
                'message' => $message,
                'fields'  => $fields,
            ],
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
