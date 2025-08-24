import type { CoverLetterData } from "./types"

export const defaultCoverLetterData: CoverLetterData = {
  head: `[Your Name]
[Your Address]
[City, State ZIP Code]
[Your Email]
[Your Phone Number]
[Date]

[Recipient's Name]
[Recipient's Title]
[Company Name]
[Company Address]
[City, State ZIP Code]

Dear [Recipient's Name],`,

  body: `I am writing to express my interest in the [Position Title] position at [Company Name], as advertised on [Where You Found the Job Posting]. With my background in [Your Field/Major] and experience in [Relevant Experience], I am confident that I would be a valuable addition to your team.

Throughout my career, I have developed strong skills in [Key Skill 1], [Key Skill 2], and [Key Skill 3]. In my previous role at [Previous Company], I [Specific Achievement or Responsibility that Relates to the Job]. This experience has prepared me well for the challenges of the [Position Title] role at your company.

I am particularly drawn to [Company Name] because of [Something Specific About the Company That Interests You]. Your company's commitment to [Company Value or Goal] aligns perfectly with my professional values and aspirations.`,

  footer: `I am excited about the opportunity to bring my unique skills and experiences to [Company Name] and would welcome the chance to discuss how I can contribute to your team. Thank you for considering my application. I look forward to the possibility of working with you.

Sincerely,

[Your Name]`,
}
