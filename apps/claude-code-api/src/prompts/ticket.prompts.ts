type Ticket = {
  key: string;
  summary: string;
  description: string;
};

export const buildImplementationPrompt = (ticket: Ticket): string =>
  `You are a developer working on the x-saas monorepo.
Implement the following ticket:

Ticket: ${ticket.key}
Summary: ${ticket.summary}
Description: ${ticket.description}

Do NOT commit — only write and save the code files.
When you are done, output the exact word: IMPLEMENTATION_COMPLETE`;

export const buildReviewPrompt = (ticketKey: string): string =>
  `You are a senior code reviewer.
Review the uncommitted changes in this repository for ticket ${ticketKey}.
Run "git diff HEAD" to see the changes.
Check for: correctness, security issues, adherence to the CLAUDE.md style guide, and test coverage.

Respond in this exact format:
HAS_ISSUES: true|false
FINDINGS:
<structured list of issues, or "No issues found" if none>`;

export const buildFixPrompt = (ticketKey: string, findings: string): string =>
  `You are a developer fixing code review findings for ticket ${ticketKey}.

The following issues were identified in the current uncommitted changes:
${findings}

Fix all issues. Do NOT commit.`;
