# MarkTrace API contract

All requests and responses use JSON. The frontend should use the real
endpoints below; it must not display a fixed diagnosis or verification result.

## GET /health

~~~json
{ "status": "ok" }
~~~

## POST /diagnose

Submit the already-graded answers from the question bank. Wrong answers must
carry their tagged error_type; conceptual and procedural errors count as gap
evidence, while careless and implementation errors remain neutral.

### Request

~~~json
{
  "student_id": "demo_student",
  "answers": [
    {
      "question_id": "rec_01",
      "concept_ids": ["recursion"],
      "correct": false,
      "error_type": "conceptual",
      "marks": 5
    }
  ]
}
~~~

### Response fields

- concept_mastery: scored concepts with mastery (0 to 1 or null) and status.
- root_gaps: most parsimonious gaps, their confidence tier, affected marks,
  questions, and downstream concepts.
- blast_radius: dependent concepts of the strongest root gap, or null.
- forecast: currently null because future exam weightage is not yet data-backed.

## POST /verify/probe

Request the three unseen questions for one supported causal pair.

~~~json
{ "root_concept_id": "recursion", "downstream_concept_id": "dp" }
~~~

The response contains direct, causal, and transfer questions, but never
contains the correct options. An unsupported pair returns HTTP 404.

## POST /verify/grade

Submit exactly one answer for each task type.

~~~json
{
  "student_id": "demo_student",
  "root_concept_id": "recursion",
  "downstream_concept_id": "dp",
  "answers": [
    { "question_id": "r_dir_p1", "task_type": "direct", "selected": "A" },
    { "question_id": "d_cau_p1", "task_type": "causal", "selected": "A" },
    { "question_id": "r_trn_p1", "task_type": "transfer", "selected": "A" }
  ]
}
~~~

The response reports a verdict, confidence tier, per-signal evidence, and a
re-diagnosis focus only when the causal link is not confirmed.
