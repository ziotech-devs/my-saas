import { type Ticket } from "../types";

export const buildImplementationPrompt = (ticket: Ticket): string =>
  `You are a developer working on the x-saas monorepo.
Implement the following ticket:

Ticket: ${ticket.key}
Summary: ${ticket.summary}
Description: ${ticket.description}

Do NOT commit — only write and save the code files.
When you are done, output the exact word: IMPLEMENTATION_COMPLETE`;

export const buildReviewPrompt = (ticket: Ticket): string =>
  `You are a senior code reviewer.
Review the uncommitted changes in this repository for ticket ${ticket.key}.
Run "git diff HEAD" to see the changes.

Ticket context:
Summary: ${ticket.summary}
Description: ${ticket.description}

Check for: correctness, security issues, adherence to the CLAUDE.md style guide, and test coverage.
Verify the implementation aligns with the ticket summary and description above.

Respond in this exact format:
HAS_ISSUES: true|false
FINDINGS:
<structured list of issues, or "No issues found" if none>`;

export const buildFixPrompt = (ticket: Ticket, findings: string): string =>
  `You are a developer fixing code review findings for ticket ${ticket.key}.

Ticket context:
Summary: ${ticket.summary}
Description: ${ticket.description}

The following issues were identified in the current uncommitted changes:
${findings}

Fix all issues. Do NOT commit.`;

export const buildTestFixPrompt = (ticket: Ticket, testOutput: string): string =>
  `You are a developer fixing failing tests for ticket ${ticket.key}.

Ticket context:
Summary: ${ticket.summary}
Description: ${ticket.description}

The following test failures were found:
${testOutput}

Fix all failing tests. Do NOT commit.`;

export const buildLintFixPrompt = (ticket: Ticket, lintOutput: string): string =>
  `You are a developer fixing lint errors for ticket ${ticket.key}.

Ticket context:
Summary: ${ticket.summary}
Description: ${ticket.description}

The following lint errors were found:
${lintOutput}

Fix all lint errors. Do NOT commit.`;
