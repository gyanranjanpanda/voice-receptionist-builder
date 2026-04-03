# Architecture Directive: Voice Receptionist Booking Engine

Established to govern the engineering and expansion of the V2 AI Voice Receptionist Integration.

## Architectural Paradigm
The system strictly follows **Clean Architecture** combined with **Domain-Driven Design (DDD)**. No framework-specific concepts or external routing objects should leak into the core business logic.

## 1. Domain Layer (The Core)
This layer contains pure, unadulterated business logic. It possesses zero dependencies on HTTP servers, API requests, or external platform rules.
- **Entities**: Structs tracking the lifecycle of an appointment (`AppointmentRequest`, `BookingConfirmation`, `AppointmentSlot`).
- **Value Objects**: Immutable types ensuring validity before actions (`PhoneNumber`, `LocalDate`, `TimeZone`, `DurationMinutes`). If a phone number is invalid, it throws an error synchronously upon instantiation inside the domain.
- **Rules**: `BookingPolicy` encapsulates domain invariants (e.g., "Cannot book outside business hours", "Time must always resolve in business timezone").

## 2. Application Layer (The Orchestrators)
This layer coordinates the flow of data but makes zero decisions on *how* data is stored or fetched.
- **Use Cases**: Singular workflow scripts such as `CheckAvailability`, `HoldAppointmentSlot`, `ConfirmAppointmentBooking`, and `HandleBookingFailure`.
- They interact with interfaces (Ports) but never import infrastructure libraries directly.

## 3. Infrastructure Layer (The Adapters)
This is where external reality connects to the internal domain.
- **Booking Adapters**: `BookingProvider` interface implementation (`MockBookingProvider`, `CalComBookingProvider`). They translate the Domain's `AppointmentRequest` into an external HTTP request (e.g., Cal.com API).
- **Vapi Adapters**: `VapiWebhookVerifier` ensuring requests are signed and secure.
- **HTTP Gateway**: `WebhookServer.ts` (Express) routing physical POST requests to the Application Use Cases.
- **Security & Observability**: Idempotency stores, metric hooks, and logging layers masking PII.

## 4. Interfaces Layer (The Delivery)
The delivery mechanism to interact with the orchestration layer.
- **CLI (Commander.js)**: Commands parsing user intentions (`voice-receptionist serve`, `voice-receptionist deploy`, `voice-receptionist test-booking`) and mapping them into the Application layer.
- **System Prompts**: Auto-generated payload instructions (`GenerateVoiceResponseFromToolResult`) mapping JSON responses strictly to conversational strings for the OpenAI LLM.

## Strict Rules
- **No Route Bloat**: `WebhookServer.ts` routes must only parse req/res and pass immediately to Application Use Cases.
- **Idempotency**: All booking actions must be retry-safe using unique correlation IDs.
- **Slot Holds**: Never confirm instantly. Always map: `Availability Check` -> `Slot Hold` -> `Final Confirmation`.
