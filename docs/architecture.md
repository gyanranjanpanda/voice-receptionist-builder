# System Architecture: AI Voice Receptionist Builder

## Overview
This document outlines the Clean Architecture for the AI Voice Receptionist Builder. The system takes an unformatted business URL and constructs a highly intelligent, configuration-ready payload for Vapi.ai using strict deterministic domain structures, human-in-the-loop review gating, and deterministic LLM transformations.

## Layer Definitions

### 1. Domain Layer (`src/domain/`)
**Responsibility:** Pure business logic and system-agnostic state holding.
- **Entities:** `BusinessProfile`, `ServiceOffering`, `FAQItem`, `OpeningHours`, `ContactChannel`, `LeadCaptureSchema`, `BookingPolicy`, `VoiceAssistantConfig`.
- **Value Objects:** Time representations, Phone numbers, Email formatting.
- **Validation Rules:**
  - `OpeningHours` strictly normalized to ISO standards (or bounded strings).
  - Business Claims explicitly bound to a `confidenceScore` [0.0 - 1.0].
  - Mandatory flag `requiresReview` attached to assumptions.

### 2. Application Layer (`src/application/`)
**Responsibility:** Coordinator and conductor of the domain. Translates commands into actions using injected infrastructure.
- **Use Cases:**
  - `ScrapeBusinessWebsite`: Takes URL, returns raw text datasets.
  - `NormalizeBusinessData`: Parses unformatted text -> `BusinessProfile`.
  - `GenerateAssistantKnowledge`: Converts `BusinessProfile` -> System Prompt.
  - `GenerateConversationFlow`: Determines Vapi node routing.
  - `BuildVapiPayload`: Assembles standard JSON config object.
  - `DeployAssistant`: Pushes to Vapi context.

### 3. Infrastructure Layer (`src/infrastructure/`)
**Responsibility:** Interface implementations for external services.
- **Adapters:**
  - `CheerioScraper` / `PlaywrightScraper`: HTML/DOM extraction tools.
  - `OpenAIExtractor`: Uses Structured Outputs for JSON ingestion of text into Domain schemas.
  - `VapiApiClient`: Fetch/Axios implementation mapping to Vapi endpoints.
  - `FileStorage`: Local disk writers/readers for caching and offline execution.

### 4. Interface Layer (`src/interfaces/`)
**Responsibility:** Delivery to the executing context/actor. 
- **CLI Controllers:** Entry points for `--build`, `--test`, `--deploy`.
- **Review Gate Presenters:** Console Table/Chalk emitters for risk warnings, extraction summaries, and missing entities.
