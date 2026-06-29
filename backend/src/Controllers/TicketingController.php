<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Database;
use App\Services\TicketingService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class TicketingController
{
    public function __construct(private ?TicketingService $ticketing = null)
    {
        $this->ticketing ??= new TicketingService();
    }

    public function registerForEvent(Request $request, Response $response, array $args): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];
        $result = $this->ticketing->createRegistration(Database::getConnection(), (int) $args['id'], $userId);

        return $this->respondWithResult($response, $result);
    }

    public function confirmPayment(Request $request, Response $response, array $args): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];
        $result = $this->ticketing->confirmPayment(Database::getConnection(), (int) $args['id'], $userId);

        return $this->respondWithResult($response, $result);
    }

    public function listMyRegistrations(Request $request, Response $response): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];

        return $this->successResponse(
            $response,
            $this->ticketing->listRegistrations(Database::getConnection(), $userId),
            200
        );
    }

    public function listMyTickets(Request $request, Response $response): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];

        return $this->successResponse(
            $response,
            $this->ticketing->listTickets(Database::getConnection(), $userId),
            200
        );
    }

    public function cancelRegistration(Request $request, Response $response, array $args): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];
        $result = $this->ticketing->cancelRegistration(Database::getConnection(), (int) $args['id'], $userId);

        return $this->respondWithResult($response, $result);
    }

    public function cancelTicket(Request $request, Response $response, array $args): Response
    {
        $userId = (int) $request->getAttribute('user')['sub'];
        $result = $this->ticketing->cancelTicket(Database::getConnection(), (int) $args['id'], $userId);

        return $this->respondWithResult($response, $result);
    }

    private function respondWithResult(Response $response, array $result): Response
    {
        if ($result['success']) {
            return $this->successResponse($response, $result['data'], $result['status'], $result['message']);
        }

        return $this->errorResponse($response, $result['code'], $result['message'], $result['status']);
    }

    private function successResponse(Response $response, mixed $data, int $status, ?string $message = null): Response
    {
        $payload = ['success' => true, 'data' => $data];
        if ($message !== null) {
            $payload['message'] = $message;
        }

        $response->getBody()->write(json_encode($payload));
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
