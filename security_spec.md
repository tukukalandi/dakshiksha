# Security Specification for DakShiksha

## 1. Data Invariants
- A `PortalDocument` must have a valid `category`, `subType`, `name`, and `link`.
- `createdBy` in a `PortalDocument` must match the authenticated user's ID.
- `createdAt` and `updatedAt` must be server-generated timestamps.
- Only admins can create/update/delete `classes`, `subjects`, `chapters`, and `portal_documents`.
- Users can only read and write their own profile data in the `users` collection.
- Educational content (`classes`, `subjects`, `chapters`) and `portal_documents` are publicly readable.

## 2. The "Dirty Dozen" Payloads

### P1: Unauthorized Portal Doc Creation
**Payload:** `{ "category": "LGO Exam", "subType": "Test", "name": "Hack", "link": "http://evil.com", "createdBy": "someone_else" }`
**Expected:** PERMISSION_DENIED (Identity Spoofing)

### P2: Client-Provided Timestamps
**Payload:** `{ "category": "GDS to MTS", "subType": "Manual", "name": "Doc", "link": "http://ok.com", "createdBy": "USER_ID", "createdAt": "2020-01-01T00:00:00Z" }`
**Expected:** PERMISSION_DENIED (Temporal Integrity Violation)

### P3: Excessive String Size
**Payload:** `{ "category": "GDS to MTS", "subType": "Manual", "name": "A".repeat(2000), "link": "http://ok.com", "createdBy": "USER_ID" }`
**Expected:** PERMISSION_DENIED (Resource Exhaustion)

### P4: Missing Required Field
**Payload:** `{ "category": "GDS to MTS", "name": "Doc", "link": "http://ok.com", "createdBy": "USER_ID" }`
**Expected:** PERMISSION_DENIED (Schema Violation - missing subType)

### P5: Shadow Field Injection (Ghost Field)
**Payload:** `{ "category": "GDS to MTS", "subType": "Manual", "name": "Doc", "link": "http://ok.com", "createdBy": "USER_ID", "isVerified": true }`
**Expected:** PERMISSION_DENIED (Update-Gap Prevention)

### P6: Unauthorized User Profile Update
**Target:** `/users/OTHER_USER_ID`
**Payload:** `{ "role": "admin" }`
**Expected:** PERMISSION_DENIED (Privilege Escalation)

### P7: Malicious Document ID
**Path:** `/portal_documents/very-long-id-that-exceeds-128-characters...`
**Expected:** PERMISSION_DENIED (ID Poisoning)

### P8: Modifying Immutable Field (createdAt)
**Payload:** `{ "createdAt": "2025-01-01T00:00:00Z" }` (on update)
**Expected:** PERMISSION_DENIED (Immutability violation)

### P9: Invalid Enum Value
**Payload:** `{ "category": "Invalid Category", ... }`
**Expected:** PERMISSION_DENIED (Enum validation)

### P10: Unauthorized Delete of Educational Content
**Target:** `/classes/class_id`
**Expected:** PERMISSION_DENIED (by non-admin)

### P11: Scraping All User Emails
**Query:** `db.collection('users')`
**Expected:** PERMISSION_DENIED (Blanket read - rule must enforce ownerId check)

### P12: Injecting Malicious Quiz HTML
**Payload:** `{ "quizHtml": "<script>alert('xss')</script>" }`
**Expected:** PERMISSION_DENIED (Security scan/validation)

## 3. Test Runner (Placeholder)
A full test runner would use `@firebase/rules-unit-testing`. Since I don't have that environment easily, I will focus on the rules implementation adhering to the logic.
