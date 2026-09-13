# API Contract

This document specifies the HTTP API shared between the MarkTrace frontend and
backend. It describes the target shape of the API — most of these endpoints
are not implemented yet in the current skeleton (only `GET /health` exists so
far). Update this file whenever a request/response shape changes.

All request and response bodies are JSON unless noted otherwise.

## `GET /health`

Liveness check used by the frontend and deploy tooling.

**Response**

```json
{ "status": "ok" }
```

## `GET /subjects`

List the available subjects.

**Response**

```json
[
  { "id": "string", "name": "string" }
]
```

## `GET /subjects/{id}/graph`

Return the concept graph for a subject.

**Response**

```json
{
  "nodes": [
    { "id": "string", "label": "string", "level": "number" }
  ],
  "edges": [
    { "from": "string", "to": "string" }
  ]
}
```

## `GET /subjects/{id}/diagnostic`

Start a diagnostic session for a subject and return its questions.

**Response**

```json
{
  "session_id": "string",
  "questions": [
    {
      "id": "string",
      "text": "string",
      "concept_ids": ["string"],
      "options": ["string"]
    }
  ]
}
```

## `POST /diagnose`

Submit answers for a diagnostic session and receive the diagnosis.

**Request**

```json
{
  "session_id": "string",
  "answers": [
    { "question_id": "string", "chosen": "string" }
  ]
}
```

**Response**

```json
{
  "session_id": "string",
  "evidence_sufficient": "boolean",
  "concept_mastery": [
    { "concept_id": "string", "name": "string", "mastery": "number", "status": "string" }
  ],
  "root_gaps": [
    {
      "concept_id": "string",
      "name": "string",
      "confidence": "number",
      "marks_associated": "number",
      "downstream_affected": ["string"]
    }
  ],
  "blast_radius": {
    "root_concept_id": "string",
    "unlocked_concepts": ["string"]
  },
  "forecast": {
    "marks_at_risk": "number",
    "by_concept": [
      { "concept_id": "string", "marks_at_risk": "number" }
    ]
  },
  "explanation": "string"
}
```

## `GET /verify/{session_id}`

Return two unseen questions targeting the identified root concept, to confirm
or refute a diagnosed gap.

**Response**

```json
{
  "session_id": "string",
  "questions": [
    {
      "id": "string",
      "text": "string",
      "concept_ids": ["string"],
      "options": ["string"]
    }
  ]
}
```

## `POST /verify`

Submit answers to the verification questions.

**Request**

```json
{
  "session_id": "string",
  "answers": [
    { "question_id": "string", "chosen": "string" }
  ]
}
```

**Response**

```json
{
  "gap_closing": "boolean",
  "new_confidence": "number"
}
```

## `GET /class/{class_id}/gapmap`

Teacher-facing aggregate view across a class. **Build later** — shape not
finalized.
